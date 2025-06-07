#!/usr/bin/env node

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Import services
const ConfigManager = require('./services/configManager');
const StreamManager = require('./services/streamManager');
const SnapshotCache = require('./services/snapshotCache');
const HealthMonitor = require('./services/healthMonitor');

// Import utilities
const logger = require('./utils/logger');
const { metrics } = require('./utils/metrics');

// Import middleware
const { smartRateLimit } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler, timeoutHandler } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

class CarWashPiApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.services = {};
    this.isShuttingDown = false;
    this.config = null;
  }

  async initialize() {
    try {
      logger.info('🚀 Starting CarWash Pi Node application...');

      // Initialize configuration first
      await this.initializeConfiguration();

      // Initialize services
      await this.initializeServices();

      // Setup Express application
      this.setupExpress();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Start core services
      await this.startServices();

      logger.info('✅ CarWash Pi application initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  async initializeConfiguration() {
    logger.info('📋 Initializing configuration...');
    
    this.services.configManager = new ConfigManager();
    await this.services.configManager.initialize();
    this.config = this.services.configManager.getConfig();

    logger.info('✅ Configuration initialized', {
      deviceId: this.config.cloud.deviceId,
      environment: process.env.NODE_ENV || 'development',
      port: this.config.server.port
    });
  }

  async initializeServices() {
    logger.info('🔧 Initializing core services...');

    // Initialize snapshot cache
    this.services.snapshotCache = new SnapshotCache({
      ttl: this.config.snapshot.cacheTTL,
      maxHistory: this.config.snapshot.cacheSize
    });

    // Initialize stream manager
    this.services.streamManager = new StreamManager(
      this.services.snapshotCache,
      this.config
    );

    // Initialize health monitor
    this.services.healthMonitor = new HealthMonitor(this.services);

    logger.info('✅ Core services initialized');
  }

  setupExpress() {
    logger.info('🌐 Setting up Express application...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow inline styles for error pages
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.server.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Device-ID']
    }));

    // Request parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(morgan('combined', { stream: logger.stream }));

    // Request timeout
    this.app.use(timeoutHandler(30000)); // 30 second timeout

    // Rate limiting
    this.app.use(smartRateLimit(this.config));

    // Request ID and timing
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.set('X-Request-ID', req.id);
      next();
    });

    logger.info('✅ Express middleware configured');
  }

  setupRoutes() {
    logger.info('🛤️  Setting up routes...');

    // Mount all routes
    this.app.use('/', routes(this.services, this.config));

    logger.info('✅ Routes configured');
  }

  setupErrorHandling() {
    logger.info('🛡️  Setting up error handling...');

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    logger.info('✅ Error handling configured');
  }

  async startServices() {
    logger.info('🎬 Starting core services...');

    try {
      // Start stream manager
      await this.services.streamManager.start();
      logger.info('✅ Stream manager started');

      // Start health monitor
      await this.services.healthMonitor.start();
      logger.info('✅ Health monitor started');

      // Setup service event listeners
      this.setupServiceListeners();

      logger.info('✅ All core services started successfully');

    } catch (error) {
      logger.error('❌ Failed to start services:', error);
      throw error;
    }
  }

  setupServiceListeners() {
    // Config manager events
    this.services.configManager.on('configReloaded', (newConfig, oldConfig) => {
      logger.info('📋 Configuration reloaded');
      this.config = newConfig;
      
      // Check if stream configuration changed
      if (this.hasStreamConfigChanged(oldConfig, newConfig)) {
        logger.info('🔄 Stream configuration changed, restarting stream...');
        this.restartStream();
      }
    });

    this.services.configManager.on('configSynced', (config) => {
      logger.info('☁️  Configuration synced from cloud');
    });

    // Stream manager events
    this.services.streamManager.on('frameReceived', (data) => {
      logger.debug('📸 Frame received', { size: data.size });
    });

    this.services.streamManager.on('streamError', (error) => {
      logger.warn('⚠️  Stream error:', error);
    });

    this.services.streamManager.on('streamFailed', (error) => {
      logger.error('💥 Stream failed:', error);
      metrics.streamRestarts.inc();
    });

    // Health monitor events
    this.services.healthMonitor.on('criticalIssue', (issue) => {
      logger.error('🚨 Critical health issue detected:', issue);
    });

    logger.info('✅ Service event listeners configured');
  }

  hasStreamConfigChanged(oldConfig, newConfig) {
    if (!oldConfig || !newConfig) return false;
    
    const oldStream = oldConfig.stream;
    const newStream = newConfig.stream;
    
    return (
      oldStream.rtspUrl !== newStream.rtspUrl ||
      oldStream.rtspTransport !== newStream.rtspTransport ||
      oldStream.timeout !== newStream.timeout ||
      oldConfig.snapshot.interval !== newConfig.snapshot.interval ||
      oldConfig.snapshot.quality !== newConfig.snapshot.quality
    );
  }

  async restartStream() {
    try {
      logger.info('🔄 Restarting stream with new configuration...');
      
      this.services.streamManager.stop();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      await this.services.streamManager.start();
      
      logger.info('✅ Stream restarted successfully');
    } catch (error) {
      logger.error('❌ Failed to restart stream:', error);
    }
  }

  async start(port) {
    try {
      await this.initialize();

      const serverPort = port || this.config.server.port;
      const serverHost = this.config.server.host;

      this.server = this.app.listen(serverPort, serverHost, () => {
        logger.info('🎉 CarWash Pi Node server started', {
          port: serverPort,
          host: serverHost,
          environment: process.env.NODE_ENV || 'development',
          deviceId: this.config.cloud.deviceId,
          pid: process.pid
        });

        // Update metrics
        metrics.configReloads.inc();
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      return this.server;

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

      // Set a timeout for forced shutdown
      const forceShutdownTimeout = setTimeout(() => {
        logger.error('💥 Forced shutdown after timeout');
        process.exit(1);
      }, 15000); // 15 seconds

      try {
        // Stop accepting new connections
        if (this.server) {
          this.server.close(() => {
            logger.info('🌐 HTTP server closed');
          });
        }

        // Stop core services
        if (this.services.streamManager) {
          this.services.streamManager.stop();
          logger.info('📹 Stream manager stopped');
        }

        if (this.services.healthMonitor) {
          this.services.healthMonitor.stop();
          logger.info('💊 Health monitor stopped');
        }

        if (this.services.configManager) {
          this.services.configManager.stop();
          logger.info('📋 Configuration manager stopped');
        }

        clearTimeout(forceShutdownTimeout);
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        clearTimeout(forceShutdownTimeout);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }

  async stop() {
    await this.shutdown('MANUAL_STOP');
  }

  getStatus() {
    return {
      isRunning: !!this.server,
      services: {
        configManager: !!this.services.configManager,
        streamManager: !!this.services.streamManager,
        snapshotCache: !!this.services.snapshotCache,
        healthMonitor: !!this.services.healthMonitor
      },
      config: {
        deviceId: this.config?.cloud?.deviceId,
        port: this.config?.server?.port,
        environment: process.env.NODE_ENV
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    };
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new CarWashPiApp();
  
  app.start().catch((error) => {
    logger.error('💥 Application failed to start:', error);
    process.exit(1);
  });
}

module.exports = CarWashPiApp;
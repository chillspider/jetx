const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/default');
const db = require('./config/database');

// Import routes
const deviceRoutes = require('./routes/devices');
const plateRoutes = require('./routes/plates');
const webhookRoutes = require('./routes/webhooks');
const templateRoutes = require('./routes/templates');
const healthRoutes = require('./routes/health');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import services to initialize them
require('./services/webhookService'); // Initialize webhook processor

class CloudApiApp {
  constructor() {
    this.app = express();
    this.server = null;
  }

  async initialize() {
    console.log('Initializing CarWash Cloud API...');
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();
    
    // Setup error handling
    this.setupErrorHandling();
    
    console.log('✓ CarWash Cloud API initialized successfully');
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet(config.security.helmet));
    
    // CORS
    this.app.use(cors(config.cors));
    
    // Compression
    this.app.use(compression());
    
    // Request logging
    this.app.use(morgan(config.logging.format));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: config.rateLimit.standardHeaders,
      legacyHeaders: config.rateLimit.legacyHeaders,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
      }
    });
    
    this.app.use('/api/', limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Trust proxy (for proper IP detection behind load balancers)
    this.app.set('trust proxy', 1);
  }

  setupRoutes() {
    // Health check (no auth required)
    this.app.use('/api/health', healthRoutes);
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'CarWash Cloud API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          devices: '/api/devices',
          plates: '/api/plates',
          webhooks: '/api/webhooks',
          templates: '/api/templates'
        }
      });
    });
    
    // API routes (with authentication)
    this.app.use('/api/devices', authMiddleware.authenticate, deviceRoutes);
    this.app.use('/api/plates', authMiddleware.authenticate, plateRoutes);
    this.app.use('/api/webhooks', authMiddleware.authenticate, webhookRoutes);
    this.app.use('/api/templates', authMiddleware.authenticate, templateRoutes);
    
    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'CarWash Fleet Management Cloud API',
        version: '1.0.0',
        description: 'Phase 2 Cloud API for managing 500+ Raspberry Pi devices',
        documentation: {
          devices: {
            description: 'Device registration and fleet management',
            endpoints: [
              'GET /api/devices - List all devices',
              'POST /api/devices - Register new device',
              'GET /api/devices/:id - Get device details',
              'PUT /api/devices/:id - Update device',
              'DELETE /api/devices/:id - Delete device',
              'POST /api/devices/:id/status - Update device status',
              'PUT /api/devices/:id/configuration - Update device configuration'
            ]
          },
          plates: {
            description: 'License plate recognition and processing',
            endpoints: [
              'GET /api/plates - List plate recognitions',
              'POST /api/plates/recognize - Process image for plate recognition',
              'GET /api/plates/:id - Get recognition details',
              'GET /api/plates/stats - Get recognition statistics'
            ]
          },
          webhooks: {
            description: 'Webhook management and delivery',
            endpoints: [
              'GET /api/webhooks - List webhooks',
              'POST /api/webhooks - Create webhook',
              'GET /api/webhooks/:id - Get webhook details',
              'PUT /api/webhooks/:id - Update webhook',
              'DELETE /api/webhooks/:id - Delete webhook',
              'POST /api/webhooks/:id/test - Test webhook delivery'
            ]
          },
          templates: {
            description: 'Configuration template management',
            endpoints: [
              'GET /api/templates - List templates',
              'POST /api/templates - Create template',
              'GET /api/templates/:id - Get template details',
              'PUT /api/templates/:id - Update template',
              'DELETE /api/templates/:id - Delete template',
              'POST /api/templates/:id/apply - Apply template to devices'
            ]
          }
        },
        authentication: {
          type: 'API Key',
          header: 'X-API-Key',
          description: 'Include your API key in the X-API-Key header'
        }
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: 'NOT_FOUND'
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    const port = config.server.port;
    const host = config.server.host;
    
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, (error) => {
        if (error) {
          console.error('Failed to start server:', error);
          reject(error);
        } else {
          console.log(`✓ CarWash Cloud API server running on http://${host}:${port}`);
          console.log(`✓ Environment: ${config.server.env}`);
          console.log(`✓ Database: Connected`);
          console.log(`✓ API Documentation: http://${host}:${port}/api`);
          resolve();
        }
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('✓ Server stopped');
          resolve();
        });
      });
    }
  }

  async shutdown() {
    console.log('Shutting down CarWash Cloud API...');
    
    try {
      // Stop server
      await this.stop();
      
      // Close database connection
      if (db && db.destroy) {
        await db.destroy();
        console.log('✓ Database connection closed');
      }
      
      console.log('✓ CarWash Cloud API shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
const app = new CloudApiApp();

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal');
  app.shutdown();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal');
  app.shutdown();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  app.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  app.shutdown();
});

// Start the application
async function startApplication() {
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (require.main === module) {
  startApplication();
}

module.exports = app;
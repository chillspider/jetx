Car Wash Fleet Management System - Development Roadmap
  Development Priority & Timeline
  Phase 1: Pi Node Stack (Weeks 1-3)
  Goal: Reliable RTSP stream processing and snapshot API on Raspberry Pi
  Phase 2: Server API & PlateRecognizer Integration (Weeks 4-6)
  Goal: Cloud management platform with license plate processing
  Phase 3: Server GUI (Weeks 7-9)
  Goal: Web dashboard for fleet management and monitoring
  Phase 4: Monitoring Stack (Weeks 10-11)
  Goal: Prometheus & Grafana observability platform
  Phase 5: Self-Healing (Weeks 12-13)
  Goal: Automated recovery and resilience systems
  Phase 6: Auto-Discovery (Weeks 14-15)
  Goal: Zero-touch camera deployment (Nice-to-have)

  Phase 1: Pi Node Stack (Weeks 1-3)
  Core Objectives

  Stream Processing: Persistent RTSP stream with FFmpeg
  Snapshot Caching: Memory-based image storage with rotation
  API Server: Fast snapshot retrieval endpoint (<100ms)
  Configuration: Dynamic config updates without restart
  Basic Monitoring: System health and stream status

  Technical Implementation
  1.1 Project Structure
  pi-node/
  ├── src/
  │   ├── app.js                 # Main application entry
  │   ├── config/
  │   │   ├── default.js         # Default configuration
  │   │   └── production.js      # Production overrides
  │   ├── services/
  │   │   ├── streamManager.js   # FFmpeg process management
  │   │   ├── snapshotCache.js   # Memory-based image caching
  │   │   ├── healthMonitor.js   # System health tracking
  │   │   └── configManager.js   # Dynamic configuration
  │   ├── controllers/
  │   │   ├── snapshotController.js  # Snapshot API endpoints
  │   │   ├── healthController.js    # Health check endpoints
  │   │   └── configController.js    # Configuration endpoints
  │   ├── middleware/
  │   │   ├── auth.js           # API key authentication
  │   │   ├── rateLimit.js      # Request rate limiting
  │   │   └── errorHandler.js   # Error handling
  │   ├── routes/
  │   │   ├── snapshots.js      # Snapshot routes
  │   │   ├── health.js         # Health routes
  │   │   └── config.js         # Configuration routes
  │   └── utils/
  │       ├── logger.js         # Winston logging
  │       └── metrics.js        # Basic metrics collection
  ├── tests/
  ├── scripts/
  │   ├── install.sh            # Pi installation script
  │   └── systemd/              # Service files
  ├── package.json
  └── README.md
  1.2 Core Services Implementation
  Stream Manager Service
  javascript// src/services/streamManager.js
  const { spawn } = require('child_process');
  const EventEmitter = require('events');
  const logger = require('../utils/logger');

  class StreamManager extends EventEmitter {
    constructor(snapshotCache, config) {
      super();
      this.snapshotCache = snapshotCache;
      this.config = config;
      this.ffmpegProcess = null;
      this.isRunning = false;
      this.retryCount = 0;
      this.maxRetries = 5;
      this.lastFrameTime = null;
    }

    async start() {
      if (this.isRunning) {
        logger.warn('Stream already running');
        return;
      }

      this.isRunning = true;
      await this.spawnFFmpeg();
    }

    async spawnFFmpeg() {
      const args = [
        '-rtsp_transport', 'tcp',
        '-timeout', '10000000',
        '-i', this.config.rtspUrl,
        '-vf', `fps=1/${this.config.snapshotInterval}`,
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-q:v', this.config.quality.toString(),
        '-'
      ];

      logger.info('Starting FFmpeg with args:', args);
      this.ffmpegProcess = spawn('ffmpeg', args);
      
      this.setupFFmpegHandlers();
    }

    setupFFmpegHandlers() {
      let imageBuffer = Buffer.alloc(0);

      this.ffmpegProcess.stdout.on('data', (chunk) => {
        imageBuffer = Buffer.concat([imageBuffer, chunk]);
        
        const startMarker = imageBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
        const endMarker = imageBuffer.indexOf(Buffer.from([0xFF, 0xD9]));
        
        if (startMarker !== -1 && endMarker !== -1 && endMarker > startMarker) {
          const completeImage = imageBuffer.slice(startMarker, endMarker + 2);
          
          this.snapshotCache.store({
            buffer: completeImage,
            timestamp: new Date().toISOString(),
            size: completeImage.length,
            streamStatus: 'active'
          });
          
          this.lastFrameTime = Date.now();
          this.retryCount = 0;
          this.emit('frameReceived', completeImage.length);
          
          imageBuffer = imageBuffer.slice(endMarker + 2);
        }
      });

      this.ffmpegProcess.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.includes('error') || message.includes('failed')) {
          logger.error('FFmpeg error:', message);
          this.emit('streamError', message);
        }
      });

      this.ffmpegProcess.on('close', (code) => {
        logger.info(`FFmpeg process exited with code ${code}`);
        this.ffmpegProcess = null;
        
        if (this.isRunning && code !== 0) {
          this.handleStreamFailure(`Process exited with code ${code}`);
        }
      });
    }

    async handleStreamFailure(error) {
      this.retryCount++;
      
      if (this.retryCount <= this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 30000);
        
        logger.warn(`Stream failed, retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries}): ${error}`);
        
        setTimeout(() => {
          if (this.isRunning) {
            this.spawnFFmpeg();
          }
        }, delay);
      } else {
        logger.error(`Stream failed after ${this.maxRetries} attempts: ${error}`);
        this.isRunning = false;
        this.emit('streamFailed', error);
      }
    }

    stop() {
      this.isRunning = false;
      if (this.ffmpegProcess) {
        this.ffmpegProcess.kill('SIGTERM');
      }
    }

    getStatus() {
      return {
        isRunning: this.isRunning,
        retryCount: this.retryCount,
        lastFrameTime: this.lastFrameTime,
        processId: this.ffmpegProcess?.pid || null
      };
    }
  }

  module.exports = StreamManager;
  Snapshot Cache Service
  javascript// src/services/snapshotCache.js
  const NodeCache = require('node-cache');
  const logger = require('../utils/logger');

  class SnapshotCache {
    constructor(options = {}) {
      this.cache = new NodeCache({
        stdTTL: options.ttl || 300,
        checkperiod: options.checkPeriod || 60,
        useClones: false
      });
      
      this.latestKey = 'latest_snapshot';
      this.maxHistorySize = options.maxHistory || 10;
      this.stats = {
        totalSnapshots: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }

    store(snapshot) {
      const enrichedSnapshot = {
        ...snapshot,
        id: this.generateId(),
        receivedAt: Date.now()
      };

      // Store as latest
      this.cache.set(this.latestKey, enrichedSnapshot);
      
      // Store in history
      const historyKey = `snapshot_${enrichedSnapshot.id}`;
      this.cache.set(historyKey, enrichedSnapshot, 600);
      
      this.stats.totalSnapshots++;
      this.cleanupHistory();
      
      logger.debug(`Stored snapshot: ${enrichedSnapshot.size} bytes`);
      return enrichedSnapshot.id;
    }

    getLatest() {
      const snapshot = this.cache.get(this.latestKey);
      
      if (snapshot) {
        this.stats.cacheHits++;
        return snapshot;
      }
      
      this.stats.cacheMisses++;
      return null;
    }

    getInfo() {
      const latest = this.cache.get(this.latestKey);
      return {
        hasSnapshot: !!latest,
        lastUpdate: latest?.timestamp || null,
        size: latest?.size || 0,
        age: latest ? Date.now() - new Date(latest.timestamp).getTime() : null,
        stats: this.stats
      };
    }

    generateId() {
      return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanupHistory() {
      const keys = this.cache.keys().filter(key => key.startsWith('snapshot_'));
      if (keys.length > this.maxHistorySize) {
        keys.sort().slice(0, keys.length - this.maxHistorySize).forEach(key => {
          this.cache.del(key);
        });
      }
    }

    getStats() {
      return {
        ...this.stats,
        cacheStats: this.cache.getStats(),
        memoryUsage: process.memoryUsage()
      };
    }
  }

  module.exports = SnapshotCache;
  API Server
  javascript// src/app.js
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');

  const StreamManager = require('./services/streamManager');
  const SnapshotCache = require('./services/snapshotCache');
  const ConfigManager = require('./services/configManager');
  const HealthMonitor = require('./services/healthMonitor');

  const snapshotRoutes = require('./routes/snapshots');
  const healthRoutes = require('./routes/health');
  const configRoutes = require('./routes/config');

  const logger = require('./utils/logger');

  class CarWashPiApp {
    constructor() {
      this.app = express();
      this.server = null;
      this.services = {};
    }

    async initialize() {
      // Initialize services
      this.services.configManager = new ConfigManager();
      this.services.snapshotCache = new SnapshotCache();
      this.services.streamManager = new StreamManager(
        this.services.snapshotCache,
        this.services.configManager.getStreamConfig()
      );
      this.services.healthMonitor = new HealthMonitor(this.services);

      // Setup Express
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();

      // Start services
      await this.startServices();

      logger.info('CarWash Pi application initialized');
    }

    setupMiddleware() {
      this.app.use(helmet());
      this.app.use(cors());
      this.app.use(express.json());

      // Rate limiting
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Too many requests'
      });
      this.app.use(limiter);
    }

    setupRoutes() {
      this.app.use('/api/snapshots', snapshotRoutes(this.services));
      this.app.use('/api/health', healthRoutes(this.services));
      this.app.use('/api/config', configRoutes(this.services));
    }

    setupErrorHandling() {
      this.app.use((err, req, res, next) => {
        logger.error('Unhandled error:', err);
        res.status(500).json({
          error: 'Internal Server Error',
          timestamp: new Date().toISOString()
        });
      });
    }

    async startServices() {
      await this.services.streamManager.start();
      await this.services.healthMonitor.start();
    }

    async start(port = 3000) {
      await this.initialize();
      
      this.server = this.app.listen(port, () => {
        logger.info(`Pi application listening on port ${port}`);
      });

      return this.server;
    }

    async shutdown() {
      logger.info('Shutting down application...');
      
      if (this.services.streamManager) {
        this.services.streamManager.stop();
      }
      
      if (this.services.healthMonitor) {
        this.services.healthMonitor.stop();
      }
      
      if (this.server) {
        this.server.close();
      }
      
      logger.info('Application shutdown complete');
    }
  }

  module.exports = CarWashPiApp;
  1.3 API Endpoints
  Snapshot Routes
  javascript// src/routes/snapshots.js
  const express = require('express');
  const router = express.Router();

  module.exports = (services) => {
    // Get latest snapshot
    router.get('/', async (req, res) => {
      try {
        const snapshot = services.snapshotCache.getLatest();
        
        if (!snapshot) {
          return res.status(404).json({
            error: 'No snapshot available',
            timestamp: new Date().toISOString()
          });
        }

        res.set({
          'Content-Type': 'image/jpeg',
          'Content-Length': snapshot.buffer.length,
          'X-Timestamp': snapshot.timestamp,
          'X-Stream-Status': snapshot.streamStatus,
          'Cache-Control': 'no-cache'
        });

        res.send(snapshot.buffer);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to retrieve snapshot',
          message: error.message
        });
      }
    });

    // Get snapshot metadata
    router.get('/info', (req, res) => {
      const info = services.snapshotCache.getInfo();
      res.json(info);
    });

    // Get snapshot statistics
    router.get('/stats', (req, res) => {
      const stats = services.snapshotCache.getStats();
      res.json(stats);
    });

    return router;
  };
  1.4 Installation & Deployment
  Installation Script
  bash#!/bin/bash
  # scripts/install.sh

  set -e

  echo "Installing CarWash Pi Node application..."

  # Update system
  sudo apt update
  sudo apt upgrade -y

  # Install Node.js 18
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs

  # Install FFmpeg
  sudo apt install -y ffmpeg

  # Install PM2 for process management
  sudo npm install -g pm2

  # Create application user
  sudo useradd -r -s /bin/false carwash || true
  sudo mkdir -p /opt/carwash
  sudo chown carwash:carwash /opt/carwash

  # Copy application files
  sudo cp -r . /opt/carwash/
  sudo chown -R carwash:carwash /opt/carwash

  # Install dependencies
  cd /opt/carwash
  sudo -u carwash npm install --production

  # Create configuration
  sudo -u carwash mkdir -p /opt/carwash/config
  sudo -u carwash cp config/default.js /opt/carwash/config/local.js

  # Install systemd service
  sudo cp scripts/systemd/carwash-pi.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable carwash-pi

  echo "Installation complete!"
  echo "Edit /opt/carwash/config/local.js with your configuration"
  echo "Start with: sudo systemctl start carwash-pi"
  Deliverables for Phase 1
  1. Core Application

  ✅ Stream Manager: Robust FFmpeg process management
  ✅ Snapshot Cache: Efficient memory-based storage
  ✅ API Server: <100ms snapshot retrieval
  ✅ Configuration: Dynamic updates without restart

  2. API Endpoints

  ✅ GET /api/snapshots - Latest snapshot image
  ✅ GET /api/snapshots/info - Metadata
  ✅ GET /api/health - System health
  ✅ POST /api/config/reload - Update configuration

  3. Installation Package

  ✅ Automated installer for Raspberry Pi
  ✅ Systemd service for auto-start
  ✅ PM2 integration for process management
  ✅ Configuration templates

  4. Testing Suite

  ✅ Unit tests for all services
  ✅ Integration tests for API endpoints
  ✅ Performance tests for concurrent requests
  ✅ Memory leak tests for long-running operation

  5. Documentation

  ✅ Installation guide
  ✅ API documentation
  ✅ Configuration reference
  ✅ Troubleshooting guide


  Phase 2: Server API & PlateRecognizer Integration (Weeks 4-6)
  Core Objectives

  Fleet Management: Centralized control of all Pi devices
  PlateRecognizer Integration: License plate processing pipeline
  Configuration Management: Template-based device configuration
  Device Communication: Real-time status and control

  Technical Implementation
  2.1 Project Structure
  cloud-api/
  ├── src/
  │   ├── app.js
  │   ├── config/
  │   ├── controllers/
  │   │   ├── fleetController.js      # Device fleet management
  │   │   ├── plateController.js      # License plate processing
  │   │   ├── configController.js     # Configuration templates
  │   │   └── webhookController.js    # Webhook handling
  │   ├── services/
  │   │   ├── fleetManager.js         # Fleet operations
  │   │   ├── plateRecognizer.js      # PlateRecognizer API integration
  │   │   ├── configService.js        # Configuration management
  │   │   └── notificationService.js  # Alert notifications
  │   ├── models/
  │   │   ├── Device.js               # Device data model
  │   │   ├── Location.js             # Location data model
  │   │   ├── ConfigTemplate.js       # Configuration templates
  │   │   └── PlateRead.js            # Plate recognition results
  │   └── middleware/
  ├── database/
  │   ├── migrations/
  │   └── seeds/
  └── tests/
  2.2 PlateRecognizer Integration
  PlateRecognizer Service
  javascript// src/services/plateRecognizer.js
  const axios = require('axios');
  const FormData = require('form-data');
  const logger = require('../utils/logger');

  class PlateRecognizerService {
    constructor() {
      this.apiKey = process.env.PLATE_RECOGNIZER_API_KEY;
      this.baseURL = 'https://api.platerecognizer.com/v1';
      this.timeout = 30000;
    }

    async recognizePlate(imageBuffer, metadata = {}) {
      try {
        const formData = new FormData();
        formData.append('upload', imageBuffer, {
          filename: 'snapshot.jpg',
          contentType: 'image/jpeg'
        });

        // Add optional parameters
        if (metadata.regions) {
          formData.append('regions', metadata.regions.join(','));
        }
        
        if (metadata.camera_id) {
          formData.append('camera_id', metadata.camera_id);
        }

        const response = await axios.post(`${this.baseURL}/plate-reader/`, formData, {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: this.timeout
        });

        return this.processPlateResult(response.data, metadata);
      } catch (error) {
        logger.error('PlateRecognizer API error:', error.message);
        
        if (error.response) {
          throw new Error(`PlateRecognizer API error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`);
        }
        
        throw new Error(`PlateRecognizer request failed: ${error.message}`);
      }
    }

    processPlateResult(apiResult, metadata) {
      const result = {
        success: apiResult.results && apiResult.results.length > 0,
        timestamp: new Date().toISOString(),
        processingTime: apiResult.processing_time,
        filename: apiResult.filename,
        camera_id: metadata.camera_id,
        location_id: metadata.location_id,
        plates: []
      };

      if (result.success) {
        result.plates = apiResult.results.map(plate => ({
          plate: plate.plate,
          confidence: plate.score,
          region: plate.region?.code || null,
          vehicle: {
            type: plate.vehicle?.type || null,
            color: plate.vehicle?.color || null,
            make: plate.vehicle?.make || null,
            model: plate.vehicle?.model || null
          },
          box: {
            xmin: plate.box?.xmin || 0,
            ymin: plate.box?.ymin || 0,
            xmax: plate.box?.xmax || 0,
            ymax: plate.box?.ymax || 0
          }
        }));
      }

      return result;
    }

    async getUsageStats() {
      try {
        const response = await axios.get(`${this.baseURL}/statistics/`, {
          headers: {
            'Authorization': `Token ${this.apiKey}`
          },
          timeout: this.timeout
        });

        return {
          total_calls: response.data.total_calls,
          calls_remaining: response.data.calls_remaining,
          usage_month: response.data.usage_month
        };
      } catch (error) {
        logger.error('Failed to get PlateRecognizer usage stats:', error.message);
        return null;
      }
    }
  }

  module.exports = PlateRecognizerService;
  Fleet Management Controller
  javascript// src/controllers/fleetController.js
  const FleetManager = require('../services/fleetManager');
  const PlateRecognizerService = require('../services/plateRecognizer');

  class FleetController {
    constructor() {
      this.fleetManager = new FleetManager();
      this.plateRecognizer = new PlateRecognizerService();
    }

    // Register new device
    async registerDevice(req, res) {
      try {
        const deviceInfo = req.body;
        const device = await this.fleetManager.registerDevice(deviceInfo);
        
        res.status(201).json({
          success: true,
          device: device,
          message: 'Device registered successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }

    // Process license plate from device
    async processPlate(req, res) {
      try {
        const { device_id, location_id } = req.body;
        
        // Get snapshot from Pi device
        const deviceInfo = await this.fleetManager.getDevice(device_id);
        if (!deviceInfo) {
          return res.status(404).json({
            success: false,
            error: 'Device not found'
          });
        }

        const snapshotResponse = await axios.get(
          `http://${deviceInfo.ip_address}/api/snapshots`,
          { responseType: 'arraybuffer', timeout: 10000 }
        );

        const imageBuffer = Buffer.from(snapshotResponse.data);
        
        // Process with PlateRecognizer
        const plateResult = await this.plateRecognizer.recognizePlate(imageBuffer, {
          camera_id: device_id,
          location_id: location_id,
          regions: ['us', 'ca'] // Configurable per location
        });

        // Store result
        await this.fleetManager.storePlateResult(plateResult);

        // Send webhook if configured
        if (deviceInfo.webhook_url && plateResult.success) {
          await this.fleetManager.sendWebhook(deviceInfo.webhook_url, {
            event: 'plate_detected',
            device_id,
            location_id,
            plate_data: plateResult.plates[0],
            timestamp: plateResult.timestamp
          });
        }

        res.json({
          success: true,
          result: plateResult
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }

    // Get fleet status
    async getFleetStatus(req, res) {
      try {
        const status = await this.fleetManager.getFleetStatus();
        const usage = await this.plateRecognizer.getUsageStats();
        
        res.json({
          fleet: status,
          plate_recognizer: usage,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }

    // Deploy configuration to devices
    async deployConfiguration(req, res) {
      try {
        const { template_id, device_ids } = req.body;
        
        const deployment = await this.fleetManager.deployConfiguration(
          template_id,
          device_ids
        );

        res.json({
          success: true,
          deployment: deployment
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  module.exports = FleetController;
  2.3 Database Models
  Device Model
  javascript// src/models/Device.js
  const { DataTypes } = require('sequelize');

  module.exports = (sequelize) => {
    const Device = sequelize.define('Device', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      device_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      location_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('online', 'offline', 'error', 'maintenance'),
        defaultValue: 'offline'
      },
      last_seen: {
        type: DataTypes.DATE
      },
      configuration: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      capabilities: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      webhook_url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      api_key: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });

    return Device;
  };
  PlateRead Model
  javascript// src/models/PlateRead.js
  const { DataTypes } = require('sequelize');

  module.exports = (sequelize) => {
    const PlateRead = sequelize.define('PlateRead', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      device_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      location_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      plate_number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      region: {
        type: DataTypes.STRING
      },
      vehicle_info: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      bounding_box: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      processing_time: {
        type: DataTypes.FLOAT
      },
      image_metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      webhook_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    });

    return PlateRead;
  };
  Deliverables for Phase 2
  1. Fleet Management API

  ✅ Device registration and authentication
  ✅ Real-time status tracking
  ✅ Configuration deployment system
  ✅ Bulk operations support

  2. PlateRecognizer Integration

  ✅ Snapshot retrieval from Pi devices
  ✅ License plate processing pipeline
  ✅ Result storage and retrieval
  ✅ Usage tracking and limits

  3. Webhook System

  ✅ Event notifications for plate detection
  ✅ Configurable endpoints per device
  ✅ Retry mechanism for failed webhooks
  ✅ Payload customization

  4. Database Schema

  ✅ Device management tables
  ✅ Configuration templates
  ✅ Plate recognition results
  ✅ Audit logging


  Phase 3: Server GUI (Weeks 7-9)
  Core Objectives

  Fleet Dashboard: Real-time overview of all locations
  Device Management: Individual device configuration and control
  Plate Recognition: View and search license plate results
  Configuration: Template management and deployment

  Technical Implementation
  3.1 Frontend Architecture
  web-dashboard/
  ├── src/
  │   ├── components/
  │   │   ├── Dashboard/
  │   │   │   ├── FleetOverview.jsx
  │   │   │   ├── LocationGrid.jsx
  │   │   │   └── StatusIndicators.jsx
  │   │   ├── Devices/
  │   │   │   ├── DeviceList.jsx
  │   │   │   ├── DeviceDetail.jsx
  │   │   │   └── DeviceConfig.jsx
  │   │   ├── PlateRecognition/
  │   │   │   ├── PlateResults.jsx
  │   │   │   ├── PlateSearch.jsx
  │   │   │   └── PlateAnalytics.jsx
  │   │   └── Configuration/
  │   │       ├── TemplateManager.jsx
  │   │       ├── BulkDeployment.jsx
  │   │       └── ConfigEditor.jsx
  │   ├── services/
  │   │   ├── api.js
  │   │   ├── websocket.js
  │   │   └── auth.js
  │   ├── hooks/
  │   │   ├── useFleetData.js
  │   │   ├── useRealTime.js
  │   │   └── useConfig.js
  │   └── utils/
  ├── public/
  └── tests/
  3.2 Key Components
  Fleet Overview Dashboard
  jsx// src/components/Dashboard/FleetOverview.jsx
  import React, { useState, useEffect } from 'react';
  import { Grid, Card, CardContent, Typography, Chip } from '@mui/material';
  import { useFleetData } from '../../hooks/useFleetData';
  import { useRealTime } from '../../hooks/useRealTime';

  const FleetOverview = () => {
    const { fleetData, loading, error } = useFleetData();
    const { realTimeUpdates } = useRealTime();

    const getStatusColor = (status) => {
      const colors = {
        online: 'success',
        offline: 'error',
        error: 'warning',
        maintenance: 'info'
      };
      return colors[status] || 'default';
    };

    if (loading) return <div>Loading fleet data...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Fleet Overview
          </Typography>
        </Grid>
        
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Locations</Typography>
              <Typography variant="h3">{fleetData.totalLocations}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Online Devices</Typography>
              <Typography variant="h3" color="success.main">
                {fleetData.onlineDevices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Plates Today</Typography>
              <Typography variant="h3">{fleetData.platesToday}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Success Rate</Typography>
              <Typography variant="h3" color="primary.main">
                {fleetData.successRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Grid */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location Status
              </Typography>
              <Grid container spacing={2}>
                {fleetData.locations.map((location) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={location.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">
                          {location.name}
                        </Typography>
                        <Chip
                          label={location.status}
                          color={getStatusColor(location.status)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {location.devices.length} devices
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last plate: {location.lastPlate}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  export default FleetOverview;
  Deliverables for Phase 3
  1. Web Dashboard

  ✅ Real-time fleet overview
  ✅ Individual device management
  ✅ Configuration interface
  ✅ Responsive design

  2. Key Features

  ✅ Live status updates via WebSocket
  ✅ Plate recognition results viewer
  ✅ Bulk operations interface
  ✅ Search and filtering

  3. User Experience

  ✅ Modern Material-UI design
  ✅ Mobile-responsive layout
  ✅ Real-time notifications
  ✅ Performance optimization


  Development Timeline Summary
  Week 1-3: Pi Node Stack ⚡
  Priority: CRITICAL

  Core RTSP processing and snapshot API
  Essential for business operation

  Week 4-6: Server API & PlateRecognizer 🎯
  Priority: CRITICAL

  Fleet management and license plate processing
  Enables revenue generation

  Week 7-9: Server GUI 📊
  Priority: HIGH

  Management dashboard and user interface
  Operational efficiency and scalability

  Week 10-11: Monitoring 📈
  Priority: MEDIUM

  Prometheus & Grafana observability
  Production readiness

  Week 12-13: Self-Healing 🔄
  Priority: MEDIUM

  Automated recovery systems
  Reduced operational overhead

  Week 14-15: Auto-Discovery 🚀
  Priority: LOW (Nice-to-have)

  Zero-touch deployment automation
  Competitive advantage

  This roadmap gets you to revenue generation by Week 6 while building toward a production-ready platform by Week 13!
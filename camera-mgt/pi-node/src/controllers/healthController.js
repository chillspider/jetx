const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const { asyncHandler } = require('../middleware/errorHandler');

class HealthController {
  constructor(services) {
    this.healthMonitor = services.healthMonitor;
    this.streamManager = services.streamManager;
    this.snapshotCache = services.snapshotCache;
    this.configManager = services.configManager;
  }

  // Basic health check
  getHealth = asyncHandler(async (req, res) => {
    try {
      const health = this.healthMonitor.getHealth();
      
      // Set appropriate HTTP status based on health
      let statusCode = 200;
      if (health.status === 'critical' || health.status === 'unhealthy') {
        statusCode = 503; // Service Unavailable
      } else if (health.status === 'warning') {
        statusCode = 200; // OK but with warnings
      }
      
      res.status(statusCode).json(health);
      
    } catch (error) {
      logger.error('Health check failed:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Detailed system statistics
  getStats = asyncHandler(async (req, res) => {
    try {
      const stats = this.healthMonitor.getStats();
      
      res.json(stats);
      
    } catch (error) {
      logger.error('Failed to get health stats:', error);
      
      res.status(500).json({
        error: 'Stats retrieval failed',
        message: 'Internal server error while retrieving health statistics',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Kubernetes-style liveness probe
  getLiveness = asyncHandler(async (req, res) => {
    try {
      // Basic check that the application is running
      const isAlive = true; // If we can respond, we're alive
      
      if (isAlive) {
        res.status(200).json({
          status: 'alive',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'dead',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      logger.error('Liveness check failed:', error);
      
      res.status(503).json({
        status: 'dead',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Kubernetes-style readiness probe
  getReadiness = asyncHandler(async (req, res) => {
    try {
      const health = this.healthMonitor.getHealth();
      
      // Ready if stream is working and no critical issues
      const isReady = health.status !== 'critical' && 
                     health.components.stream !== 'failed';
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          health: health.status,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          health: health.status,
          issues: health.issues,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      logger.error('Readiness check failed:', error);
      
      res.status(503).json({
        status: 'not ready',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Detailed component health
  getComponents = asyncHandler(async (req, res) => {
    try {
      const streamStatus = this.streamManager.getStatus();
      const cacheInfo = this.snapshotCache.getInfo();
      const configStatus = this.configManager.getStatus();
      
      const components = {
        stream: {
          status: streamStatus.isRunning ? 'healthy' : 'unhealthy',
          details: {
            running: streamStatus.isRunning,
            processId: streamStatus.processId,
            retryCount: streamStatus.retryCount,
            lastFrame: streamStatus.lastFrameTime,
            frameCount: streamStatus.frameCount,
            uptime: streamStatus.uptime,
            healthy: this.streamManager.isHealthy()
          }
        },
        cache: {
          status: cacheInfo.hasSnapshot ? 'healthy' : 'warning',
          details: {
            hasSnapshot: cacheInfo.hasSnapshot,
            lastUpdate: cacheInfo.lastUpdate,
            size: cacheInfo.size,
            historyCount: cacheInfo.historyCount,
            stats: cacheInfo.stats
          }
        },
        config: {
          status: 'healthy',
          details: {
            lastSync: configStatus.lastSyncTime,
            syncErrors: configStatus.syncErrors,
            cloudSyncEnabled: configStatus.cloudSyncEnabled
          }
        },
        api: {
          status: 'healthy',
          details: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
          }
        }
      };
      
      res.json({
        components,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get component health:', error);
      
      res.status(500).json({
        error: 'Component health failed',
        message: 'Internal server error while retrieving component health',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Trigger self-healing
  triggerSelfHealing = asyncHandler(async (req, res) => {
    try {
      logger.info('Self-healing triggered via API', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await this.healthMonitor.performSelfHealing();
      
      res.json({
        success: true,
        message: 'Self-healing process initiated',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Self-healing trigger failed:', error);
      
      res.status(500).json({
        error: 'Self-healing failed',
        message: 'Internal server error while triggering self-healing',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Restart stream (admin operation)
  restartStream = asyncHandler(async (req, res) => {
    try {
      logger.info('Stream restart triggered via API', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      this.streamManager.stop();
      
      // Wait a moment before restarting
      setTimeout(async () => {
        try {
          await this.streamManager.start();
        } catch (error) {
          logger.error('Failed to restart stream:', error);
        }
      }, 2000);
      
      res.json({
        success: true,
        message: 'Stream restart initiated',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Stream restart failed:', error);
      
      res.status(500).json({
        error: 'Stream restart failed',
        message: 'Internal server error while restarting stream',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get system version info
  getVersion = asyncHandler(async (req, res) => {
    try {
      const packageJson = require('../../package.json');
      
      const version = {
        application: {
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description
        },
        system: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime()
        },
        device: {
          deviceId: this.configManager.get('cloud.deviceId'),
          hostname: require('os').hostname()
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(version);
      
    } catch (error) {
      logger.error('Failed to get version info:', error);
      
      res.status(500).json({
        error: 'Version info failed',
        message: 'Internal server error while retrieving version information',
        timestamp: new Date().toISOString()
      });
    }
  });
}

module.exports = HealthController;
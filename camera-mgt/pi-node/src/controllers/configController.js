const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

class ConfigController {
  constructor(services) {
    this.configManager = services.configManager;
    this.streamManager = services.streamManager;
    
    // Validation schema for configuration updates
    this.updateSchema = Joi.object({
      stream: Joi.object({
        rtspUrl: Joi.string().uri({ scheme: ['rtsp'] }),
        rtspTransport: Joi.string().valid('tcp', 'udp'),
        timeout: Joi.number().min(1000000),
        reconnectDelay: Joi.number().min(1000),
        maxRetries: Joi.number().min(1).max(100)
      }),
      snapshot: Joi.object({
        interval: Joi.number().min(1).max(300),
        quality: Joi.number().min(1).max(5),
        cacheSize: Joi.number().min(1).max(100),
        cacheTTL: Joi.number().min(60).max(3600),
        maxSize: Joi.number().min(100000).max(10000000)
      }),
      api: Joi.object({
        key: Joi.string().min(10)
      }),
      cloud: Joi.object({
        apiUrl: Joi.string().uri(),
        syncInterval: Joi.number().min(10000),
        webhookUrl: Joi.string().uri().allow(null),
        deviceId: Joi.string()
      })
    }).unknown(false); // Don't allow unknown fields
  }

  // Get current configuration (sanitized)
  getConfig = asyncHandler(async (req, res) => {
    try {
      const config = this.configManager.getConfig();
      const sanitized = this.sanitizeConfig(config);
      
      res.json({
        configuration: sanitized,
        status: this.configManager.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get configuration:', error);
      
      res.status(500).json({
        error: 'Configuration retrieval failed',
        message: 'Internal server error while retrieving configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Update configuration
  updateConfig = asyncHandler(async (req, res) => {
    try {
      const updates = req.body;
      
      // Validate the updates
      const { error, value } = this.updateSchema.validate(updates);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Configuration validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          })),
          timestamp: new Date().toISOString()
        });
      }
      
      const oldConfig = this.configManager.getConfig();
      
      // Apply updates
      await this.configManager.updateConfig(value);
      
      const newConfig = this.configManager.getConfig();
      
      // Check if stream configuration changed
      const streamConfigChanged = this.hasStreamConfigChanged(oldConfig, newConfig);
      
      logger.info('Configuration updated via API', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        updates: this.sanitizeConfig(value),
        streamConfigChanged
      });
      
      // Restart stream if stream configuration changed
      if (streamConfigChanged) {
        logger.info('Stream configuration changed, restarting stream...');
        this.streamManager.stop();
        
        setTimeout(async () => {
          try {
            await this.streamManager.start();
            logger.info('Stream restarted successfully after configuration change');
          } catch (error) {
            logger.error('Failed to restart stream after configuration change:', error);
          }
        }, 2000);
      }
      
      res.json({
        success: true,
        message: 'Configuration updated successfully',
        applied: this.sanitizeConfig(value),
        streamRestart: streamConfigChanged,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to update configuration:', error);
      
      res.status(500).json({
        error: 'Configuration update failed',
        message: error.message || 'Internal server error while updating configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Reload configuration from file and cloud
  reloadConfig = asyncHandler(async (req, res) => {
    try {
      logger.info('Configuration reload triggered via API', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await this.configManager.reload();
      
      res.json({
        success: true,
        message: 'Configuration reloaded successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to reload configuration:', error);
      
      res.status(500).json({
        error: 'Configuration reload failed',
        message: error.message || 'Internal server error while reloading configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get configuration status
  getStatus = asyncHandler(async (req, res) => {
    try {
      const status = this.configManager.getStatus();
      
      res.json({
        status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get configuration status:', error);
      
      res.status(500).json({
        error: 'Status retrieval failed',
        message: 'Internal server error while retrieving configuration status',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Sync with cloud configuration
  syncConfig = asyncHandler(async (req, res) => {
    try {
      logger.info('Configuration sync triggered via API', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await this.configManager.syncWithCloud();
      
      res.json({
        success: true,
        message: 'Configuration sync completed',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to sync configuration:', error);
      
      res.status(500).json({
        error: 'Configuration sync failed',
        message: error.message || 'Internal server error while syncing configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Validate configuration without applying
  validateConfig = asyncHandler(async (req, res) => {
    try {
      const config = req.body;
      
      const { error } = this.updateSchema.validate(config);
      
      if (error) {
        return res.status(400).json({
          valid: false,
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          })),
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        valid: true,
        message: 'Configuration is valid',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to validate configuration:', error);
      
      res.status(500).json({
        error: 'Configuration validation failed',
        message: 'Internal server error while validating configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get configuration schema/template
  getSchema = asyncHandler(async (req, res) => {
    try {
      const schema = {
        stream: {
          rtspUrl: {
            type: 'string',
            format: 'uri',
            scheme: 'rtsp',
            required: true,
            description: 'RTSP stream URL'
          },
          rtspTransport: {
            type: 'string',
            enum: ['tcp', 'udp'],
            default: 'tcp',
            description: 'RTSP transport protocol'
          },
          timeout: {
            type: 'number',
            minimum: 1000000,
            default: 10000000,
            description: 'Connection timeout in microseconds'
          },
          reconnectDelay: {
            type: 'number',
            minimum: 1000,
            default: 5000,
            description: 'Delay between reconnection attempts in milliseconds'
          },
          maxRetries: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 5,
            description: 'Maximum number of retry attempts'
          }
        },
        snapshot: {
          interval: {
            type: 'number',
            minimum: 1,
            maximum: 300,
            default: 10,
            description: 'Snapshot interval in seconds'
          },
          quality: {
            type: 'number',
            minimum: 1,
            maximum: 5,
            default: 3,
            description: 'JPEG quality (1=best, 5=worst)'
          },
          cacheSize: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 10,
            description: 'Number of snapshots to keep in cache'
          },
          cacheTTL: {
            type: 'number',
            minimum: 60,
            maximum: 3600,
            default: 300,
            description: 'Cache time-to-live in seconds'
          }
        }
      };
      
      res.json({
        schema,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get configuration schema:', error);
      
      res.status(500).json({
        error: 'Schema retrieval failed',
        message: 'Internal server error while retrieving configuration schema',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Helper method to sanitize configuration (remove sensitive data)
  sanitizeConfig(config) {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    // Remove or mask sensitive fields
    if (sanitized.api && sanitized.api.key) {
      sanitized.api.key = '***';
    }
    
    if (sanitized.stream && sanitized.stream.rtspUrl) {
      // Hide password in RTSP URL
      sanitized.stream.rtspUrl = sanitized.stream.rtspUrl.replace(
        /:\/\/([^:]+):([^@]+)@/,
        '://$1:***@'
      );
    }
    
    return sanitized;
  }

  // Helper method to check if stream configuration changed
  hasStreamConfigChanged(oldConfig, newConfig) {
    const oldStream = oldConfig.stream;
    const newStream = newConfig.stream;
    
    if (!oldStream || !newStream) return false;
    
    return (
      oldStream.rtspUrl !== newStream.rtspUrl ||
      oldStream.rtspTransport !== newStream.rtspTransport ||
      oldStream.timeout !== newStream.timeout ||
      oldConfig.snapshot.interval !== newConfig.snapshot.interval ||
      oldConfig.snapshot.quality !== newConfig.snapshot.quality
    );
  }
}

module.exports = ConfigController;
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const chokidar = require('chokidar');
const Joi = require('joi');
const axios = require('axios');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

// Configuration schema for validation
const configSchema = Joi.object({
  stream: Joi.object({
    rtspUrl: Joi.string().uri({ scheme: ['rtsp'] }).required(),
    rtspTransport: Joi.string().valid('tcp', 'udp').default('tcp'),
    timeout: Joi.number().min(1000000).default(10000000),
    reconnectDelay: Joi.number().min(1000).default(5000),
    maxRetries: Joi.number().min(1).max(100).default(5)
  }).required(),
  
  snapshot: Joi.object({
    interval: Joi.number().min(1).max(300).default(10),
    quality: Joi.number().min(1).max(5).default(3),
    cacheSize: Joi.number().min(1).max(100).default(10),
    cacheTTL: Joi.number().min(60).max(3600).default(300),
    maxSize: Joi.number().min(100000).max(10000000).default(5242880)
  }).required(),
  
  api: Joi.object({
    key: Joi.string().min(10).required()
  }).required(),
  
  cloud: Joi.object({
    apiUrl: Joi.string().uri().required(),
    syncInterval: Joi.number().min(10000).default(60000),
    webhookUrl: Joi.string().uri().allow(null).default(null),
    deviceId: Joi.string().required()
  }).required()
}).unknown(true); // Allow additional fields

class ConfigManager extends EventEmitter {
  constructor() {
    super();
    this.config = null;
    this.configPath = path.join(process.cwd(), 'config', 'local.json');
    this.watcher = null;
    this.syncTimer = null;
    this.lastSyncTime = null;
    this.syncErrors = 0;
  }

  async initialize() {
    try {
      // Load base configuration
      const defaultConfig = require('../config/default');
      const envConfig = process.env.NODE_ENV === 'production' 
        ? require('../config/production') 
        : {};
      
      // Merge configurations
      this.config = this.mergeConfig(defaultConfig, envConfig);
      
      // Try to load local config file
      await this.loadLocalConfig();
      
      // Validate configuration
      await this.validateConfig();
      
      // Start file watcher
      this.startFileWatcher();
      
      // Start cloud sync if enabled
      if (this.config.cloud && this.config.cloud.syncInterval > 0) {
        this.startCloudSync();
      }
      
      logger.info('Configuration manager initialized');
      logger.debug('Current configuration:', this.sanitizeConfig(this.config));
      
    } catch (error) {
      logger.error('Failed to initialize configuration manager:', error);
      throw error;
    }
  }

  async loadLocalConfig() {
    try {
      const exists = await this.fileExists(this.configPath);
      if (exists) {
        const data = await fs.readFile(this.configPath, 'utf8');
        const localConfig = JSON.parse(data);
        this.config = this.mergeConfig(this.config, localConfig);
        logger.info('Loaded local configuration from:', this.configPath);
      }
    } catch (error) {
      logger.warn('Failed to load local config:', error.message);
    }
  }

  async saveLocalConfig(config) {
    try {
      const dir = path.dirname(this.configPath);
      await fs.mkdir(dir, { recursive: true });
      
      const data = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configPath, data, 'utf8');
      
      logger.info('Saved configuration to:', this.configPath);
    } catch (error) {
      logger.error('Failed to save local config:', error);
      throw error;
    }
  }

  startFileWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }
    
    this.watcher = chokidar.watch(this.configPath, {
      persistent: true,
      ignoreInitial: true
    });
    
    this.watcher.on('change', async () => {
      logger.info('Configuration file changed, reloading...');
      await this.reload();
    });
  }

  async startCloudSync() {
    // Initial sync
    await this.syncWithCloud();
    
    // Schedule periodic syncs
    this.syncTimer = setInterval(async () => {
      await this.syncWithCloud();
    }, this.config.cloud.syncInterval);
  }

  async syncWithCloud() {
    try {
      const response = await axios.get(
        `${this.config.cloud.apiUrl}/api/devices/${this.config.cloud.deviceId}/config`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api.key}`,
            'X-Device-ID': this.config.cloud.deviceId
          },
          timeout: 30000
        }
      );
      
      if (response.data && response.data.configuration) {
        const cloudConfig = response.data.configuration;
        
        // Validate cloud configuration
        const validation = configSchema.validate(cloudConfig);
        if (validation.error) {
          logger.error('Invalid cloud configuration:', validation.error.message);
          metrics.configSyncErrors.inc();
          return;
        }
        
        // Apply cloud configuration
        this.config = this.mergeConfig(this.config, cloudConfig);
        await this.saveLocalConfig(this.config);
        
        this.lastSyncTime = new Date();
        this.syncErrors = 0;
        
        logger.info('Successfully synced configuration from cloud');
        this.emit('configSynced', this.config);
      }
    } catch (error) {
      this.syncErrors++;
      metrics.configSyncErrors.inc();
      
      if (error.response) {
        logger.error(`Cloud sync failed with status ${error.response.status}:`, error.response.data);
      } else {
        logger.error('Cloud sync failed:', error.message);
      }
      
      // If too many sync errors, reduce sync frequency
      if (this.syncErrors > 5) {
        logger.warn('Too many sync errors, reducing sync frequency');
        clearInterval(this.syncTimer);
        this.syncTimer = setInterval(async () => {
          await this.syncWithCloud();
        }, this.config.cloud.syncInterval * 5); // 5x slower
      }
    }
  }

  async reload() {
    try {
      const oldConfig = { ...this.config };
      
      await this.loadLocalConfig();
      await this.validateConfig();
      
      metrics.configReloads.inc();
      
      logger.info('Configuration reloaded successfully');
      this.emit('configReloaded', this.config, oldConfig);
      
    } catch (error) {
      logger.error('Failed to reload configuration:', error);
      this.emit('configReloadError', error);
    }
  }

  async validateConfig() {
    const validation = configSchema.validate(this.config);
    if (validation.error) {
      throw new Error(`Configuration validation failed: ${validation.error.message}`);
    }
  }

  mergeConfig(...configs) {
    const merged = {};
    
    for (const config of configs) {
      for (const key in config) {
        if (config[key] === null || config[key] === undefined) {
          continue;
        }
        
        if (typeof config[key] === 'object' && !Array.isArray(config[key])) {
          merged[key] = this.mergeConfig(merged[key] || {}, config[key]);
        } else {
          merged[key] = config[key];
        }
      }
    }
    
    return merged;
  }

  sanitizeConfig(config) {
    const sanitized = { ...config };
    
    // Remove sensitive data
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

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  get(path) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  set(path, value) {
    const keys = path.split('.');
    let obj = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }
    
    obj[keys[keys.length - 1]] = value;
  }

  getConfig() {
    return { ...this.config };
  }

  getStreamConfig() {
    return { ...this.config.stream };
  }

  getSnapshotConfig() {
    return { ...this.config.snapshot };
  }

  getCloudConfig() {
    return { ...this.config.cloud };
  }

  getStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      syncErrors: this.syncErrors,
      configPath: this.configPath,
      cloudSyncEnabled: this.config.cloud.syncInterval > 0
    };
  }

  async updateConfig(updates) {
    try {
      // Merge updates
      this.config = this.mergeConfig(this.config, updates);
      
      // Validate
      await this.validateConfig();
      
      // Save
      await this.saveLocalConfig(this.config);
      
      // Emit event
      this.emit('configUpdated', this.config);
      
      logger.info('Configuration updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update configuration:', error);
      throw error;
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    logger.info('Configuration manager stopped');
  }
}

module.exports = ConfigManager;
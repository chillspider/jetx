const si = require('systeminformation');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

class HealthMonitor extends EventEmitter {
  constructor(services) {
    super();
    this.services = services;
    this.config = services.configManager.getConfig();
    this.monitoringInterval = null;
    this.healthCheckInterval = null;
    this.stats = {
      cpu: { usage: 0, temperature: 0 },
      memory: { used: 0, total: 0, percentage: 0 },
      disk: { used: 0, total: 0, percentage: 0 },
      network: { rx: 0, tx: 0 },
      uptime: 0
    };
    this.healthStatus = {
      overall: 'healthy',
      stream: 'unknown',
      api: 'healthy',
      system: 'healthy',
      issues: []
    };
  }

  async start() {
    logger.info('Starting health monitor');
    
    // Initial health check
    await this.checkHealth();
    
    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.collectSystemMetrics();
    }, this.config.monitoring.systemMetricsInterval);
    
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, this.config.monitoring.healthCheckInterval);
    
    // Listen to service events
    this.setupServiceListeners();
  }

  setupServiceListeners() {
    // Stream manager events
    if (this.services.streamManager) {
      this.services.streamManager.on('frameReceived', () => {
        this.healthStatus.stream = 'healthy';
      });
      
      this.services.streamManager.on('streamError', (error) => {
        this.healthStatus.stream = 'error';
        this.addIssue('stream', error);
      });
      
      this.services.streamManager.on('streamFailed', (error) => {
        this.healthStatus.stream = 'failed';
        this.addIssue('stream', `Stream failed: ${error}`);
      });
    }
    
    // Config manager events
    if (this.services.configManager) {
      this.services.configManager.on('configReloaded', () => {
        this.config = this.services.configManager.getConfig();
      });
    }
  }

  async collectSystemMetrics() {
    try {
      // CPU information
      const cpuData = await si.currentLoad();
      const cpuTemp = await si.cpuTemperature();
      
      this.stats.cpu = {
        usage: cpuData.currentLoad || 0,
        temperature: cpuTemp.main || 0
      };
      
      // Memory information
      const memData = await si.mem();
      this.stats.memory = {
        used: memData.used,
        total: memData.total,
        percentage: (memData.used / memData.total) * 100
      };
      
      // Disk information
      const diskData = await si.fsSize();
      const rootDisk = diskData.find(disk => disk.mount === '/') || diskData[0];
      if (rootDisk) {
        this.stats.disk = {
          used: rootDisk.used,
          total: rootDisk.size,
          percentage: rootDisk.use
        };
      }
      
      // Network information
      const netData = await si.networkStats();
      if (netData && netData.length > 0) {
        this.stats.network = {
          rx: netData[0].rx_bytes || 0,
          tx: netData[0].tx_bytes || 0
        };
      }
      
      // System uptime
      const timeData = await si.time();
      this.stats.uptime = timeData.uptime;
      
      // Update Prometheus metrics
      this.updateMetrics();
      
      // Check for warnings
      this.checkSystemThresholds();
      
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  updateMetrics() {
    // Update temperature metric
    if (this.stats.cpu.temperature > 0) {
      metrics.systemTemperature.set(this.stats.cpu.temperature);
    }
    
    // Log high-level stats periodically
    logger.debug('System stats:', {
      cpu: `${this.stats.cpu.usage.toFixed(1)}%`,
      memory: `${this.stats.memory.percentage.toFixed(1)}%`,
      disk: `${this.stats.disk.percentage.toFixed(1)}%`,
      temp: `${this.stats.cpu.temperature}°C`
    });
  }

  checkSystemThresholds() {
    const issues = [];
    
    // Temperature checks
    if (this.stats.cpu.temperature >= this.config.monitoring.temperature.critical) {
      issues.push({
        type: 'temperature',
        severity: 'critical',
        message: `CPU temperature critical: ${this.stats.cpu.temperature}°C`
      });
    } else if (this.stats.cpu.temperature >= this.config.monitoring.temperature.warning) {
      issues.push({
        type: 'temperature',
        severity: 'warning',
        message: `CPU temperature high: ${this.stats.cpu.temperature}°C`
      });
    }
    
    // Memory checks
    if (this.stats.memory.percentage >= this.config.monitoring.memory.critical) {
      issues.push({
        type: 'memory',
        severity: 'critical',
        message: `Memory usage critical: ${this.stats.memory.percentage.toFixed(1)}%`
      });
    } else if (this.stats.memory.percentage >= this.config.monitoring.memory.warning) {
      issues.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage high: ${this.stats.memory.percentage.toFixed(1)}%`
      });
    }
    
    // Disk checks
    if (this.stats.disk.percentage >= this.config.monitoring.disk.critical) {
      issues.push({
        type: 'disk',
        severity: 'critical',
        message: `Disk usage critical: ${this.stats.disk.percentage.toFixed(1)}%`
      });
    } else if (this.stats.disk.percentage >= this.config.monitoring.disk.warning) {
      issues.push({
        type: 'disk',
        severity: 'warning',
        message: `Disk usage high: ${this.stats.disk.percentage.toFixed(1)}%`
      });
    }
    
    // Update health status
    if (issues.length > 0) {
      this.healthStatus.system = issues.some(i => i.severity === 'critical') ? 'critical' : 'warning';
      issues.forEach(issue => this.addIssue('system', issue.message, issue.severity));
      
      // Emit events for critical issues
      issues.filter(i => i.severity === 'critical').forEach(issue => {
        this.emit('criticalIssue', issue);
      });
    } else {
      this.healthStatus.system = 'healthy';
    }
  }

  async checkHealth() {
    try {
      // Clear old issues
      this.healthStatus.issues = this.healthStatus.issues.filter(
        issue => Date.now() - issue.timestamp < 300000 // Keep issues for 5 minutes
      );
      
      // Check stream health
      if (this.services.streamManager) {
        const streamStatus = this.services.streamManager.getStatus();
        if (!streamStatus.isRunning) {
          this.healthStatus.stream = 'stopped';
          this.addIssue('stream', 'Stream is not running');
        } else if (!this.services.streamManager.isHealthy()) {
          this.healthStatus.stream = 'unhealthy';
          this.addIssue('stream', 'Stream is not receiving frames');
        } else {
          this.healthStatus.stream = 'healthy';
        }
      }
      
      // Check snapshot cache
      if (this.services.snapshotCache) {
        const cacheInfo = this.services.snapshotCache.getInfo();
        if (!cacheInfo.hasSnapshot) {
          this.addIssue('snapshot', 'No snapshots available');
        } else if (cacheInfo.lastUpdateAge > 60000) { // 1 minute
          this.addIssue('snapshot', 'Snapshots are stale');
        }
      }
      
      // Determine overall health
      this.updateOverallHealth();
      
      // Log health status
      if (this.healthStatus.overall !== 'healthy') {
        logger.warn('Health check issues:', this.healthStatus);
      }
      
    } catch (error) {
      logger.error('Health check failed:', error);
      this.healthStatus.overall = 'error';
      this.addIssue('health', `Health check error: ${error.message}`);
    }
  }

  updateOverallHealth() {
    const statuses = [
      this.healthStatus.stream,
      this.healthStatus.api,
      this.healthStatus.system
    ];
    
    if (statuses.includes('critical') || statuses.includes('failed')) {
      this.healthStatus.overall = 'critical';
    } else if (statuses.includes('error') || statuses.includes('unhealthy')) {
      this.healthStatus.overall = 'unhealthy';
    } else if (statuses.includes('warning')) {
      this.healthStatus.overall = 'warning';
    } else if (statuses.includes('unknown')) {
      this.healthStatus.overall = 'unknown';
    } else {
      this.healthStatus.overall = 'healthy';
    }
  }

  addIssue(component, message, severity = 'error') {
    const issue = {
      component,
      message,
      severity,
      timestamp: Date.now()
    };
    
    // Avoid duplicate issues
    const exists = this.healthStatus.issues.some(
      i => i.component === component && i.message === message
    );
    
    if (!exists) {
      this.healthStatus.issues.push(issue);
      logger.warn(`Health issue - ${component}: ${message}`);
    }
  }

  getHealth() {
    return {
      status: this.healthStatus.overall,
      components: {
        stream: this.healthStatus.stream,
        api: this.healthStatus.api,
        system: this.healthStatus.system
      },
      issues: this.healthStatus.issues,
      timestamp: new Date().toISOString()
    };
  }

  getStats() {
    return {
      system: {
        cpu: {
          usage: `${this.stats.cpu.usage.toFixed(1)}%`,
          temperature: `${this.stats.cpu.temperature}°C`
        },
        memory: {
          used: Math.round(this.stats.memory.used / 1024 / 1024) + ' MB',
          total: Math.round(this.stats.memory.total / 1024 / 1024) + ' MB',
          percentage: `${this.stats.memory.percentage.toFixed(1)}%`
        },
        disk: {
          used: Math.round(this.stats.disk.used / 1024 / 1024 / 1024) + ' GB',
          total: Math.round(this.stats.disk.total / 1024 / 1024 / 1024) + ' GB',
          percentage: `${this.stats.disk.percentage.toFixed(1)}%`
        },
        network: {
          rx: Math.round(this.stats.network.rx / 1024 / 1024) + ' MB',
          tx: Math.round(this.stats.network.tx / 1024 / 1024) + ' MB'
        },
        uptime: this.formatUptime(this.stats.uptime)
      },
      services: {
        stream: this.services.streamManager?.getStatus() || {},
        cache: this.services.snapshotCache?.getInfo() || {},
        config: this.services.configManager?.getStatus() || {}
      }
    };
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '0m';
  }

  async performSelfHealing() {
    logger.info('Performing self-healing checks');
    
    // Check if stream needs restart
    if (this.healthStatus.stream === 'failed' || this.healthStatus.stream === 'error') {
      logger.info('Attempting to restart stream');
      this.services.streamManager.stop();
      await new Promise(resolve => setTimeout(resolve, 5000));
      await this.services.streamManager.start();
    }
    
    // Clear cache if memory is critical
    if (this.stats.memory.percentage >= this.config.monitoring.memory.critical) {
      logger.info('Clearing snapshot cache due to high memory usage');
      this.services.snapshotCache.clear();
    }
    
    // More self-healing actions can be added here
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    logger.info('Health monitor stopped');
  }
}

module.exports = HealthMonitor;
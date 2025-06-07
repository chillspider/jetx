module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      enabled: true,
      origin: '*'
    }
  },

  // RTSP Stream Configuration
  stream: {
    rtspUrl: process.env.RTSP_URL || 'rtsp://localhost:8554/test',
    rtspTransport: 'tcp',
    timeout: 10000000,
    reconnectDelay: 5000,
    maxRetries: 5
  },

  // Snapshot Configuration
  snapshot: {
    interval: parseInt(process.env.SNAPSHOT_INTERVAL) || 10, // seconds
    quality: parseInt(process.env.SNAPSHOT_QUALITY) || 3, // 1-5 (1=best, 5=worst)
    cacheSize: parseInt(process.env.SNAPSHOT_CACHE_SIZE) || 10, // number of snapshots to keep
    cacheTTL: parseInt(process.env.SNAPSHOT_CACHE_TTL) || 300, // seconds
    maxSize: 5 * 1024 * 1024 // 5MB max snapshot size
  },

  // API Configuration
  api: {
    key: process.env.API_KEY || 'development-key-change-in-production',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000
    }
  },

  // Cloud Configuration
  cloud: {
    apiUrl: process.env.CLOUD_API_URL || 'http://localhost:3001',
    syncInterval: 60000, // 1 minute
    webhookUrl: process.env.WEBHOOK_URL || null,
    deviceId: process.env.DEVICE_ID || `pi-${require('os').hostname()}`
  },

  // System Monitoring
  monitoring: {
    metricsPort: process.env.METRICS_PORT || 9090,
    healthCheckInterval: 30000, // 30 seconds
    systemMetricsInterval: 10000, // 10 seconds
    temperature: {
      warning: 70, // Celsius
      critical: 80 // Celsius
    },
    memory: {
      warning: 80, // percentage
      critical: 90 // percentage
    },
    disk: {
      warning: 80, // percentage
      critical: 90 // percentage
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    console: true,
    file: {
      enabled: true,
      filename: 'logs/pi-node.log',
      maxSize: '20m',
      maxFiles: 5
    }
  },

  // FFmpeg Configuration
  ffmpeg: {
    path: process.env.FFMPEG_PATH || 'ffmpeg',
    inputOptions: [
      '-rtsp_transport', 'tcp',
      '-stimeout', '10000000',
      '-use_wallclock_as_timestamps', '1'
    ],
    outputOptions: [
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-update', '1'
    ]
  },

  // Self-Healing Configuration
  selfHealing: {
    enabled: true,
    maxProcessRestarts: 10,
    restartCooldown: 60000, // 1 minute
    memoryThreshold: 512 * 1024 * 1024, // 512MB
    autoRestartOnCrash: true
  }
};
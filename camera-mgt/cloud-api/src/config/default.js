require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3003,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'carwash_dev',
    user: process.env.DB_USER || 'carwash',
    password: process.env.DB_PASSWORD || 'carwash_dev_pass',
    ssl: process.env.DB_SSL === 'true'
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },

  plateRecognizer: {
    apiKey: process.env.PLATE_RECOGNIZER_API_KEY,
    apiUrl: process.env.PLATE_RECOGNIZER_API_URL || 'https://api.platerecognizer.com/v1',
    timeout: parseInt(process.env.PLATE_RECOGNIZER_TIMEOUT) || 30000,
    regions: process.env.PLATE_RECOGNIZER_REGIONS?.split(',') || ['us', 'ca'],
    minConfidence: parseFloat(process.env.PLATE_RECOGNIZER_MIN_CONFIDENCE) || 0.7
  },

  webhook: {
    defaultTimeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000,
    batchSize: parseInt(process.env.WEBHOOK_BATCH_SIZE) || 100,
    processInterval: parseInt(process.env.WEBHOOK_PROCESS_INTERVAL) || 5000
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    directory: process.env.LOG_DIRECTORY || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    port: process.env.METRICS_PORT || 9090,
    path: process.env.METRICS_PATH || '/metrics'
  },

  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 10485760, // 10MB
    allowedMimeTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png'],
    directory: process.env.UPLOAD_DIRECTORY || './uploads',
    thumbnailSize: {
      width: parseInt(process.env.THUMBNAIL_WIDTH) || 200,
      height: parseInt(process.env.THUMBNAIL_HEIGHT) || 150
    }
  },

  device: {
    heartbeatInterval: parseInt(process.env.DEVICE_HEARTBEAT_INTERVAL) || 60000, // 1 minute
    offlineThreshold: parseInt(process.env.DEVICE_OFFLINE_THRESHOLD) || 300000, // 5 minutes
    configSyncInterval: parseInt(process.env.CONFIG_SYNC_INTERVAL) || 3600000, // 1 hour
    maxDevicesPerSite: parseInt(process.env.MAX_DEVICES_PER_SITE) || 50
  },

  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    },
    apiKeyLength: parseInt(process.env.API_KEY_LENGTH) || 32
  }
};
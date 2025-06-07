module.exports = {
  // Production overrides
  server: {
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || 'https://carwash-fleet.com'
    }
  },

  // Production logging
  logging: {
    level: process.env.LOG_LEVEL || 'warn',
    console: false,
    file: {
      enabled: true,
      filename: '/var/log/carwash/pi-node.log'
    }
  },

  // Production API security
  api: {
    key: process.env.API_KEY, // Must be set in production
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100 // More restrictive in production
    }
  },

  // Production self-healing
  selfHealing: {
    enabled: true,
    maxProcessRestarts: 5, // More conservative in production
    restartCooldown: 300000 // 5 minutes
  }
};
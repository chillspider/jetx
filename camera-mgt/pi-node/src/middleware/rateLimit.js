const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiting
const createApiLimiter = (config) => {
  return rateLimit({
    windowMs: config.api.rateLimit.windowMs,
    max: config.api.rateLimit.max,
    message: {
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${config.api.rateLimit.max} requests per ${config.api.rateLimit.windowMs / 60000} minutes.`,
      retryAfter: Math.ceil(config.api.rateLimit.windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${config.api.rateLimit.max} requests per ${config.api.rateLimit.windowMs / 60000} minutes.`,
        retryAfter: Math.ceil(config.api.rateLimit.windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Snapshot endpoint rate limiting (more restrictive)
const createSnapshotLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 1 request per second on average
    message: {
      error: 'Snapshot rate limit exceeded',
      message: 'Maximum 60 snapshot requests per minute allowed',
      retryAfter: 60,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Snapshot rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Snapshot rate limit exceeded',
        message: 'Maximum 60 snapshot requests per minute allowed',
        retryAfter: 60,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Configuration endpoint rate limiting (very restrictive)
const createConfigLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 config changes per 15 minutes
    message: {
      error: 'Configuration rate limit exceeded',
      message: 'Maximum 10 configuration requests per 15 minutes allowed',
      retryAfter: 15 * 60,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Configuration rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Configuration rate limit exceeded',
        message: 'Maximum 10 configuration requests per 15 minutes allowed',
        retryAfter: 15 * 60,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Health check rate limiting (lenient)
const createHealthLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 2 requests per second on average
    message: {
      error: 'Health check rate limit exceeded',
      message: 'Maximum 120 health check requests per minute allowed',
      retryAfter: 60,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Health check rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Health check rate limit exceeded',
        message: 'Maximum 120 health check requests per minute allowed',
        retryAfter: 60,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Custom rate limiter based on request type
const smartRateLimit = (config) => {
  const apiLimiter = createApiLimiter(config);
  const snapshotLimiter = createSnapshotLimiter();
  const configLimiter = createConfigLimiter();
  const healthLimiter = createHealthLimiter();
  
  return (req, res, next) => {
    // Different limits based on endpoint
    if (req.path.includes('/snapshot')) {
      return snapshotLimiter(req, res, next);
    } else if (req.path.includes('/config')) {
      return configLimiter(req, res, next);
    } else if (req.path.includes('/health')) {
      return healthLimiter(req, res, next);
    } else {
      return apiLimiter(req, res, next);
    }
  };
};

module.exports = {
  createApiLimiter,
  createSnapshotLimiter,
  createConfigLimiter,
  createHealthLimiter,
  smartRateLimit
};
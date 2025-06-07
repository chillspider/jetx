const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.id || Date.now().toString();
  
  // Log the error
  logger.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: requestId
  });
  
  // Record metrics
  const statusCode = err.statusCode || err.status || 500;
  metrics.recordApiCall(req.method, req.route?.path || req.url, statusCode, 0);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let errorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: timestamp,
    requestId: requestId
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse = {
      error: 'Validation Error',
      message: err.message,
      details: err.details || {},
      timestamp: timestamp,
      requestId: requestId
    };
    res.status(400);
  } else if (err.name === 'UnauthorizedError') {
    errorResponse = {
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: timestamp,
      requestId: requestId
    };
    res.status(401);
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    errorResponse = {
      error: 'File Too Large',
      message: 'Uploaded file exceeds size limit',
      timestamp: timestamp,
      requestId: requestId
    };
    res.status(413);
  } else if (err.type === 'entity.parse.failed') {
    errorResponse = {
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      timestamp: timestamp,
      requestId: requestId
    };
    res.status(400);
  } else {
    // Generic server error
    res.status(statusCode);
    
    if (isDevelopment) {
      errorResponse.stack = err.stack;
      errorResponse.details = err;
    }
  }
  
  res.json(errorResponse);
};

// 404 handler for non-existent routes
const notFoundHandler = (req, res) => {
  const timestamp = new Date().toISOString();
  
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  metrics.recordApiCall(req.method, req.url, 404, 0);
  
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    timestamp: timestamp,
    availableEndpoints: [
      'GET /api/snapshot',
      'GET /api/snapshot/info',
      'GET /api/health',
      'GET /api/health/stats',
      'POST /api/config/reload',
      'GET /metrics'
    ]
  });
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request timeout handler
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeout, () => {
      logger.warn('Request timeout', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        timeout: timeout
      });
      
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: 'Request took too long to process',
          timeout: timeout,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    next();
  };
};

// Validation error handler
const validationErrorHandler = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error', {
        error: error.details,
        body: req.body,
        url: req.url
      });
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

// Health check for error handler
const isHealthy = () => {
  return {
    errorHandler: 'operational',
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  timeoutHandler,
  validationErrorHandler,
  isHealthy
};
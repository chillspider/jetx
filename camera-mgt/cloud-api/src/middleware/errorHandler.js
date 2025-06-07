const config = require('../config/default');

class ErrorHandler {
  /**
   * Global error handling middleware
   */
  handle(error, req, res, next) {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Default error response
    let statusCode = error.statusCode || 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = null;

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      errorCode = 'VALIDATION_ERROR';
      details = error.details || error.message;
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      errorCode = 'INVALID_ID';
    } else if (error.code === '23505') {
      // PostgreSQL unique constraint violation
      statusCode = 409;
      message = 'Resource already exists';
      errorCode = 'DUPLICATE_RESOURCE';
    } else if (error.code === '23503') {
      // PostgreSQL foreign key constraint violation
      statusCode = 400;
      message = 'Referenced resource does not exist';
      errorCode = 'FOREIGN_KEY_ERROR';
    } else if (error.code === '23502') {
      // PostgreSQL not null constraint violation
      statusCode = 400;
      message = 'Required field is missing';
      errorCode = 'MISSING_REQUIRED_FIELD';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid authentication token';
      errorCode = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Authentication token has expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.name === 'MulterError') {
      statusCode = 400;
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'File size too large';
        errorCode = 'FILE_TOO_LARGE';
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        message = 'Too many files';
        errorCode = 'TOO_MANY_FILES';
      } else {
        message = 'File upload error';
        errorCode = 'UPLOAD_ERROR';
      }
    } else if (error.message) {
      // Use error message if available
      message = error.message;
      
      // Set appropriate status codes based on message content
      if (message.toLowerCase().includes('not found')) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
      } else if (message.toLowerCase().includes('unauthorized')) {
        statusCode = 401;
        errorCode = 'UNAUTHORIZED';
      } else if (message.toLowerCase().includes('forbidden')) {
        statusCode = 403;
        errorCode = 'FORBIDDEN';
      } else if (message.toLowerCase().includes('validation')) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      }
    }

    // Build error response
    const errorResponse = {
      success: false,
      message: message,
      error: errorCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    };

    // Add details in development environment
    if (config.server.env === 'development') {
      errorResponse.details = details;
      errorResponse.stack = error.stack;
    }

    // Add request ID if available
    if (req.requestId) {
      errorResponse.request_id = req.requestId;
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Handle 404 errors
   */
  notFound(req, res, next) {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
  }

  /**
   * Handle async errors
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Create custom error
   */
  createError(message, statusCode = 500, errorCode = 'CUSTOM_ERROR') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.errorCode = errorCode;
    return error;
  }

  /**
   * Validation error helper
   */
  validationError(message, details = null) {
    const error = new Error(message);
    error.name = 'ValidationError';
    error.statusCode = 400;
    error.details = details;
    return error;
  }

  /**
   * Not found error helper
   */
  notFoundError(resource = 'Resource') {
    const error = new Error(`${resource} not found`);
    error.statusCode = 404;
    return error;
  }

  /**
   * Unauthorized error helper
   */
  unauthorizedError(message = 'Unauthorized access') {
    const error = new Error(message);
    error.statusCode = 401;
    return error;
  }

  /**
   * Forbidden error helper
   */
  forbiddenError(message = 'Access forbidden') {
    const error = new Error(message);
    error.statusCode = 403;
    return error;
  }

  /**
   * Conflict error helper
   */
  conflictError(message = 'Resource conflict') {
    const error = new Error(message);
    error.statusCode = 409;
    return error;
  }

  /**
   * Rate limit error helper
   */
  rateLimitError(message = 'Rate limit exceeded') {
    const error = new Error(message);
    error.statusCode = 429;
    return error;
  }
}

const errorHandler = new ErrorHandler();

// Export the middleware function and helper methods
module.exports = errorHandler.handle.bind(errorHandler);
module.exports.notFound = errorHandler.notFound.bind(errorHandler);
module.exports.asyncHandler = errorHandler.asyncHandler.bind(errorHandler);
module.exports.createError = errorHandler.createError.bind(errorHandler);
module.exports.validationError = errorHandler.validationError.bind(errorHandler);
module.exports.notFoundError = errorHandler.notFoundError.bind(errorHandler);
module.exports.unauthorizedError = errorHandler.unauthorizedError.bind(errorHandler);
module.exports.forbiddenError = errorHandler.forbiddenError.bind(errorHandler);
module.exports.conflictError = errorHandler.conflictError.bind(errorHandler);
module.exports.rateLimitError = errorHandler.rateLimitError.bind(errorHandler);
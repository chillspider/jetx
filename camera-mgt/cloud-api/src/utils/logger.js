const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config/default');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDirectory = config.logging.directory;
    this.ensureLogDirectory();
    this.logger = this.createLogger();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  createLogger() {
    const formats = {
      file: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      console: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          
          if (Object.keys(meta).length > 0) {
            msg += `\n${JSON.stringify(meta, null, 2)}`;
          }
          
          return msg;
        })
      )
    };

    const transports = [];

    // Console transport for development
    if (config.server.env === 'development') {
      transports.push(
        new winston.transports.Console({
          level: config.logging.level,
          format: formats.console,
          handleExceptions: true,
          handleRejections: true
        })
      );
    }

    // File transport for all logs
    transports.push(
      new DailyRotateFile({
        filename: path.join(this.logDirectory, 'app-%DATE%.log'),
        datePattern: config.logging.datePattern,
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        level: config.logging.level,
        format: formats.file,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Error-only file transport
    transports.push(
      new DailyRotateFile({
        filename: path.join(this.logDirectory, 'error-%DATE%.log'),
        datePattern: config.logging.datePattern,
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        level: 'error',
        format: formats.file
      })
    );

    // HTTP access log transport
    transports.push(
      new DailyRotateFile({
        filename: path.join(this.logDirectory, 'access-%DATE%.log'),
        datePattern: config.logging.datePattern,
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        level: 'http',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );

    return winston.createLogger({
      level: config.logging.level,
      transports,
      exitOnError: false
    });
  }

  // Convenience methods
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  // Log request/response for API calls
  logRequest(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    };

    // Add auth info if available
    if (req.auth) {
      logData.auth = {
        type: req.auth.type,
        user_id: req.auth.user_id,
        device_id: req.auth.device_id
      };
    }

    this.http('HTTP Request', logData);
  }

  // Log database queries
  logQuery(query, duration, error = null) {
    const logData = {
      query: query.sql || query,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = error.message;
      this.error('Database Query Failed', logData);
    } else {
      this.debug('Database Query', logData);
    }
  }

  // Log external API calls
  logExternalAPI(service, method, url, duration, statusCode, error = null) {
    const logData = {
      service,
      method,
      url,
      duration: `${duration}ms`,
      statusCode,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = error.message;
      this.error(`External API Error: ${service}`, logData);
    } else {
      this.info(`External API Call: ${service}`, logData);
    }
  }

  // Log webhook deliveries
  logWebhook(webhookId, url, status, attempts, error = null) {
    const logData = {
      webhook_id: webhookId,
      url,
      status,
      attempts,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = error.message;
      this.error('Webhook Delivery Failed', logData);
    } else {
      this.info('Webhook Delivered', logData);
    }
  }

  // Log security events
  logSecurity(event, details) {
    const logData = {
      event,
      ...details,
      timestamp: new Date().toISOString()
    };

    this.warn('Security Event', logData);
  }

  // Log performance metrics
  logPerformance(operation, duration, metadata = {}) {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...metadata,
      timestamp: new Date().toISOString()
    };

    if (duration > 5000) {
      this.warn('Slow Operation', logData);
    } else {
      this.debug('Performance', logData);
    }
  }

  // Create child logger with context
  child(context) {
    return {
      error: (message, meta = {}) => this.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
      http: (message, meta = {}) => this.http(message, { ...context, ...meta })
    };
  }

  // Create request-specific logger
  forRequest(req) {
    const context = {
      requestId: req.id || Math.random().toString(36).substring(7),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    };

    if (req.auth) {
      context.auth = {
        type: req.auth.type,
        user_id: req.auth.user_id,
        device_id: req.auth.device_id
      };
    }

    return this.child(context);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
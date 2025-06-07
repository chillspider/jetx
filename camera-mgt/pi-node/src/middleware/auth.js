const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

// API Key authentication middleware
const authenticateApiKey = (config) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // Get API key from header or query parameter
      const apiKey = req.headers['x-api-key'] || 
                    req.headers['authorization']?.replace('Bearer ', '') ||
                    req.query.api_key;
      
      if (!apiKey) {
        logger.warn('API request without API key', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('User-Agent')
        });
        
        metrics.recordApiCall(req.method, req.route?.path || req.url, 401, (Date.now() - startTime) / 1000);
        
        return res.status(401).json({
          error: 'API key required',
          message: 'Please provide a valid API key in X-API-Key header or Authorization header',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate API key
      if (apiKey !== config.api.key) {
        logger.warn('Invalid API key attempt', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('User-Agent'),
          providedKey: apiKey.substring(0, 10) + '...'
        });
        
        metrics.recordApiCall(req.method, req.route?.path || req.url, 403, (Date.now() - startTime) / 1000);
        
        return res.status(403).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid',
          timestamp: new Date().toISOString()
        });
      }
      
      // Set authenticated flag and device info
      req.authenticated = true;
      req.deviceId = config.cloud.deviceId;
      
      logger.debug('API request authenticated', {
        ip: req.ip,
        url: req.url,
        deviceId: req.deviceId
      });
      
      next();
      
    } catch (error) {
      logger.error('Authentication error:', error);
      metrics.recordApiCall(req.method, req.route?.path || req.url, 500, (Date.now() - startTime) / 1000);
      
      res.status(500).json({
        error: 'Authentication error',
        message: 'Internal server error during authentication',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Optional authentication - allows requests with or without API key
const optionalAuth = (config) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || 
                  req.headers['authorization']?.replace('Bearer ', '') ||
                  req.query.api_key;
    
    if (apiKey && apiKey === config.api.key) {
      req.authenticated = true;
      req.deviceId = config.cloud.deviceId;
    } else {
      req.authenticated = false;
    }
    
    next();
  };
};

// Middleware to check if request is from local network
const localNetworkOnly = () => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check if IP is local
    const isLocal = clientIP === '127.0.0.1' ||
                   clientIP === '::1' ||
                   clientIP.startsWith('192.168.') ||
                   clientIP.startsWith('10.') ||
                   clientIP.startsWith('172.16.') ||
                   clientIP.startsWith('172.17.') ||
                   clientIP.startsWith('172.18.') ||
                   clientIP.startsWith('172.19.') ||
                   clientIP.startsWith('172.2') ||
                   clientIP.startsWith('172.30.') ||
                   clientIP.startsWith('172.31.');
    
    if (!isLocal) {
      logger.warn('Non-local network access attempt', {
        ip: clientIP,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'This endpoint is only accessible from local network',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

// Device ID validation middleware
const validateDeviceId = () => {
  return (req, res, next) => {
    const deviceId = req.headers['x-device-id'] || req.params.deviceId;
    
    if (deviceId && req.deviceId && deviceId !== req.deviceId) {
      logger.warn('Device ID mismatch', {
        requestedDevice: deviceId,
        authenticatedDevice: req.deviceId,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Device ID mismatch',
        message: 'The requested device ID does not match the authenticated device',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateApiKey,
  optionalAuth,
  localNetworkOnly,
  validateDeviceId
};
const deviceService = require('../services/deviceService');
const jwt = require('jsonwebtoken');
const config = require('../config/default');

class AuthMiddleware {
  /**
   * Authenticate API requests using API key or JWT
   */
  async authenticate(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'];
      const authHeader = req.headers.authorization;

      // Check for API key first (device authentication)
      if (apiKey) {
        const device = await deviceService.getDeviceByApiKey(apiKey);
        
        if (!device) {
          return res.status(401).json({
            success: false,
            message: 'Invalid API key',
            error: 'INVALID_API_KEY'
          });
        }

        // Add device info to request
        req.device = device;
        req.auth = {
          type: 'device',
          device_id: device.device_id,
          api_key: apiKey
        };

        return next();
      }

      // Check for JWT token (admin/user authentication)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, config.auth.jwtSecret);
          
          req.auth = {
            type: 'user',
            user_id: decoded.user_id,
            role: decoded.role,
            permissions: decoded.permissions || []
          };

          return next();
        } catch (jwtError) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
          });
        }
      }

      // No authentication provided
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Provide X-API-Key header or Authorization Bearer token',
        error: 'AUTHENTICATION_REQUIRED'
      });

    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication service error',
        error: 'AUTHENTICATION_ERROR'
      });
    }
  }

  /**
   * Require specific authentication type
   */
  requireDeviceAuth(req, res, next) {
    if (!req.auth || req.auth.type !== 'device') {
      return res.status(403).json({
        success: false,
        message: 'Device authentication required',
        error: 'DEVICE_AUTH_REQUIRED'
      });
    }
    next();
  }

  /**
   * Require user authentication
   */
  requireUserAuth(req, res, next) {
    if (!req.auth || req.auth.type !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'User authentication required',
        error: 'USER_AUTH_REQUIRED'
      });
    }
    next();
  }

  /**
   * Require specific role
   */
  requireRole(role) {
    return (req, res, next) => {
      if (!req.auth || req.auth.type !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'User authentication required',
          error: 'USER_AUTH_REQUIRED'
        });
      }

      if (req.auth.role !== role) {
        return res.status(403).json({
          success: false,
          message: `Role '${role}' required`,
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }

  /**
   * Require specific permission
   */
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.auth || req.auth.type !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'User authentication required',
          error: 'USER_AUTH_REQUIRED'
        });
      }

      if (!req.auth.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `Permission '${permission}' required`,
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }

  /**
   * Validate device ownership (device can only access its own data)
   */
  validateDeviceOwnership(req, res, next) {
    if (req.auth && req.auth.type === 'device') {
      const deviceId = req.params.device_id || req.params.id;
      
      if (deviceId && req.device && req.device.device_id !== deviceId && req.device.id !== deviceId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Device can only access its own data',
          error: 'ACCESS_DENIED'
        });
      }
    }
    
    next();
  }

  /**
   * Optional authentication (doesn't fail if no auth provided)
   */
  async optionalAuth(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'];
      const authHeader = req.headers.authorization;

      if (apiKey) {
        const device = await deviceService.getDeviceByApiKey(apiKey);
        if (device) {
          req.device = device;
          req.auth = {
            type: 'device',
            device_id: device.device_id,
            api_key: apiKey
          };
        }
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, config.auth.jwtSecret);
          req.auth = {
            type: 'user',
            user_id: decoded.user_id,
            role: decoded.role,
            permissions: decoded.permissions || []
          };
        } catch (jwtError) {
          // Ignore JWT errors for optional auth
        }
      }

      next();
    } catch (error) {
      // Ignore errors for optional auth
      next();
    }
  }

  /**
   * Generate JWT token for user
   */
  generateToken(userData) {
    const payload = {
      user_id: userData.id,
      role: userData.role,
      permissions: userData.permissions || []
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthMiddleware();
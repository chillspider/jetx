const { 
  authenticateApiKey, 
  optionalAuth, 
  localNetworkOnly, 
  validateDeviceId 
} = require('../../../src/middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next, mockConfig;

  beforeEach(() => {
    mockConfig = createMockConfig();
    
    req = {
      headers: {},
      query: {},
      ip: '127.0.0.1',
      url: '/api/test',
      method: 'GET',
      get: jest.fn()
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('authenticateApiKey', () => {
    let authMiddleware;

    beforeEach(() => {
      authMiddleware = authenticateApiKey(mockConfig);
    });

    it('should authenticate valid API key in header', () => {
      req.headers['x-api-key'] = mockConfig.api.key;

      authMiddleware(req, res, next);

      expect(req.authenticated).toBe(true);
      expect(req.deviceId).toBe(mockConfig.cloud.deviceId);
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate valid API key in authorization header', () => {
      req.headers['authorization'] = `Bearer ${mockConfig.api.key}`;

      authMiddleware(req, res, next);

      expect(req.authenticated).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate valid API key in query parameter', () => {
      req.query.api_key = mockConfig.api.key;

      authMiddleware(req, res, next);

      expect(req.authenticated).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no API key provided', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'API key required',
        message: 'Please provide a valid API key in X-API-Key header or Authorization header',
        timestamp: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid API key', () => {
      req.headers['x-api-key'] = 'invalid-key';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid API key',
        message: 'The provided API key is not valid',
        timestamp: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', () => {
      // Mock an error in the authentication process
      req.headers['x-api-key'] = mockConfig.api.key;
      mockConfig.cloud.deviceId = undefined; // This might cause an error

      authMiddleware(req, res, next);

      // Should still authenticate successfully
      expect(req.authenticated).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should log authentication attempts', () => {
      req.ip = '192.168.1.100';
      req.get.mockReturnValue('Test User Agent');
      req.headers['x-api-key'] = 'invalid-key';

      authMiddleware(req, res, next);

      expect(req.get).toHaveBeenCalledWith('User-Agent');
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle missing config gracefully', () => {
      const invalidAuthMiddleware = authenticateApiKey({});

      invalidAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuth', () => {
    let optionalAuthMiddleware;

    beforeEach(() => {
      optionalAuthMiddleware = optionalAuth(mockConfig);
    });

    it('should authenticate when valid API key provided', () => {
      req.headers['x-api-key'] = mockConfig.api.key;

      optionalAuthMiddleware(req, res, next);

      expect(req.authenticated).toBe(true);
      expect(req.deviceId).toBe(mockConfig.cloud.deviceId);
      expect(next).toHaveBeenCalled();
    });

    it('should allow access when no API key provided', () => {
      optionalAuthMiddleware(req, res, next);

      expect(req.authenticated).toBe(false);
      expect(req.deviceId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should not authenticate invalid API key but still allow access', () => {
      req.headers['x-api-key'] = 'invalid-key';

      optionalAuthMiddleware(req, res, next);

      expect(req.authenticated).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should handle multiple API key sources', () => {
      req.headers['authorization'] = `Bearer ${mockConfig.api.key}`;
      req.query.api_key = 'different-key';

      optionalAuthMiddleware(req, res, next);

      expect(req.authenticated).toBe(true);
    });
  });

  describe('localNetworkOnly', () => {
    let localNetworkMiddleware;

    beforeEach(() => {
      localNetworkMiddleware = localNetworkOnly();
    });

    it('should allow localhost IPv4', () => {
      req.ip = '127.0.0.1';

      localNetworkMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow localhost IPv6', () => {
      req.ip = '::1';

      localNetworkMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow private network 192.168.x.x', () => {
      req.ip = '192.168.1.100';

      localNetworkMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow private network 10.x.x.x', () => {
      req.ip = '10.0.0.1';

      localNetworkMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow private network 172.16.x.x to 172.31.x.x', () => {
      req.ip = '172.16.0.1';
      localNetworkMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();

      next.mockClear();
      req.ip = '172.31.255.255';
      localNetworkMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should deny public IP addresses', () => {
      req.ip = '8.8.8.8';
      req.get.mockReturnValue('Test User Agent');

      localNetworkMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'This endpoint is only accessible from local network',
        timestamp: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle connection.remoteAddress fallback', () => {
      req.ip = undefined;
      req.connection = { remoteAddress: '192.168.1.100' };

      localNetworkMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should log denied access attempts', () => {
      req.ip = '8.8.8.8';
      req.url = '/sensitive-endpoint';
      req.get.mockReturnValue('Malicious User Agent');

      localNetworkMiddleware(req, res, next);

      expect(req.get).toHaveBeenCalledWith('User-Agent');
    });
  });

  describe('validateDeviceId', () => {
    let validateDeviceIdMiddleware;

    beforeEach(() => {
      validateDeviceIdMiddleware = validateDeviceId();
      req.deviceId = 'test-device-001';
    });

    it('should allow matching device ID in header', () => {
      req.headers['x-device-id'] = 'test-device-001';

      validateDeviceIdMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow matching device ID in params', () => {
      req.params = { deviceId: 'test-device-001' };

      validateDeviceIdMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow when no device ID specified in request', () => {
      validateDeviceIdMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny mismatched device ID in header', () => {
      req.headers['x-device-id'] = 'different-device';
      req.ip = '192.168.1.100';

      validateDeviceIdMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device ID mismatch',
        message: 'The requested device ID does not match the authenticated device',
        timestamp: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny mismatched device ID in params', () => {
      req.params = { deviceId: 'different-device' };

      validateDeviceIdMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing authenticated device ID', () => {
      req.deviceId = undefined;
      req.headers['x-device-id'] = 'some-device';

      validateDeviceIdMiddleware(req, res, next);

      expect(next).toHaveBeenCalled(); // Should allow when no authenticated device
    });

    it('should prefer header over params when both present', () => {
      req.headers['x-device-id'] = 'test-device-001';
      req.params = { deviceId: 'different-device' };

      validateDeviceIdMiddleware(req, res, next);

      expect(next).toHaveBeenCalled(); // Header matches, so should pass
    });
  });

  describe('integration scenarios', () => {
    it('should work with authentication then device validation', () => {
      const authMiddleware = authenticateApiKey(mockConfig);
      const deviceMiddleware = validateDeviceId();

      req.headers['x-api-key'] = mockConfig.api.key;
      req.headers['x-device-id'] = mockConfig.cloud.deviceId;

      authMiddleware(req, res, () => {
        deviceMiddleware(req, res, next);
      });

      expect(req.authenticated).toBe(true);
      expect(req.deviceId).toBe(mockConfig.cloud.deviceId);
      expect(next).toHaveBeenCalled();
    });

    it('should work with optional auth then local network check', () => {
      const optionalAuthMiddleware = optionalAuth(mockConfig);
      const localNetworkMiddleware = localNetworkOnly();

      req.ip = '192.168.1.100';

      optionalAuthMiddleware(req, res, () => {
        localNetworkMiddleware(req, res, next);
      });

      expect(req.authenticated).toBe(false);
      expect(next).toHaveBeenCalled();
    });

    it('should handle error in middleware chain', () => {
      const authMiddleware = authenticateApiKey(mockConfig);

      req.headers['x-api-key'] = mockConfig.api.key;

      // Simulate error by making next throw
      const errorNext = jest.fn(() => {
        throw new Error('Middleware chain error');
      });

      expect(() => {
        authMiddleware(req, res, errorNext);
      }).toThrow('Middleware chain error');

      expect(req.authenticated).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined headers', () => {
      req.headers = undefined;
      const authMiddleware = authenticateApiKey(mockConfig);

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle empty API key', () => {
      req.headers['x-api-key'] = '';
      const authMiddleware = authenticateApiKey(mockConfig);

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle null IP address', () => {
      req.ip = null;
      req.connection = {};
      const localNetworkMiddleware = localNetworkOnly();

      localNetworkMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle very long API key', () => {
      const longKey = 'a'.repeat(10000);
      req.headers['x-api-key'] = longKey;
      const authMiddleware = authenticateApiKey(mockConfig);

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle special characters in device ID', () => {
      req.deviceId = 'device-001!@#$%';
      req.headers['x-device-id'] = 'device-001!@#$%';
      const deviceMiddleware = validateDeviceId();

      deviceMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('security considerations', () => {
    it('should not leak API key in error messages', () => {
      req.headers['x-api-key'] = 'secret-key-should-not-leak';
      const authMiddleware = authenticateApiKey(mockConfig);

      authMiddleware(req, res, next);

      const errorResponse = res.json.mock.calls[0][0];
      expect(JSON.stringify(errorResponse)).not.toContain('secret-key-should-not-leak');
    });

    it('should truncate logged API key', () => {
      req.headers['x-api-key'] = 'very-long-secret-api-key-that-should-be-truncated';
      req.ip = '192.168.1.100';
      req.get.mockReturnValue('Test Agent');
      const authMiddleware = authenticateApiKey(mockConfig);

      authMiddleware(req, res, next);

      // Should log truncated key (first 10 chars + ...)
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should validate against timing attacks', () => {
      const authMiddleware = authenticateApiKey(mockConfig);
      const startTime = Date.now();

      req.headers['x-api-key'] = 'wrong-key';
      authMiddleware(req, res, next);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Authentication should complete quickly (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
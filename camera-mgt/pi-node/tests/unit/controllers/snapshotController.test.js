const SnapshotController = require('../../../src/controllers/snapshotController');

describe('SnapshotController', () => {
  let snapshotController;
  let mockServices;
  let req, res;

  beforeEach(() => {
    mockServices = {
      snapshotCache: {
        getLatest: jest.fn(),
        getInfo: jest.fn(),
        getStats: jest.fn(),
        getById: jest.fn(),
        getAllSnapshots: jest.fn(),
        clear: jest.fn()
      },
      streamManager: {
        getStatus: jest.fn(() => ({
          isRunning: true,
          processId: 12345,
          retryCount: 0,
          frameCount: 100,
          uptime: 60000,
          healthy: true
        })),
        isHealthy: jest.fn(() => true)
      }
    };

    snapshotController = new SnapshotController(mockServices);

    // Mock Express request and response
    req = {
      method: 'GET',
      route: { path: '/api/snapshot' },
      params: {},
      ip: '127.0.0.1',
      get: jest.fn()
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
  });

  describe('getLatest', () => {
    it('should return latest snapshot successfully', async () => {
      const mockSnapshot = createMockSnapshot();
      mockServices.snapshotCache.getLatest.mockReturnValue(mockSnapshot);

      await snapshotController.getLatest(req, res);

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpeg',
        'Content-Length': mockSnapshot.buffer.length,
        'X-Timestamp': mockSnapshot.timestamp,
        'X-Stream-Status': mockSnapshot.streamStatus,
        'X-Snapshot-Age': expect.any(Number),
        'X-Snapshot-ID': mockSnapshot.id,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      expect(res.send).toHaveBeenCalledWith(mockSnapshot.buffer);
    });

    it('should return 404 when no snapshot available', async () => {
      mockServices.snapshotCache.getLatest.mockReturnValue(null);

      await snapshotController.getLatest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No snapshot available',
        message: 'No recent snapshots found in cache',
        timestamp: expect.any(String)
      });
    });

    it('should return 503 for empty snapshot buffer', async () => {
      const emptySnapshot = {
        ...createMockSnapshot(),
        buffer: Buffer.alloc(0)
      };
      mockServices.snapshotCache.getLatest.mockReturnValue(emptySnapshot);

      await snapshotController.getLatest(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid snapshot',
        message: 'Snapshot data is corrupted or empty',
        timestamp: expect.any(String)
      });
    });

    it('should warn about stale snapshots but still serve them', async () => {
      const staleSnapshot = {
        ...createMockSnapshot(),
        timestamp: new Date(Date.now() - 120000).toISOString() // 2 minutes old
      };
      mockServices.snapshotCache.getLatest.mockReturnValue(staleSnapshot);

      await snapshotController.getLatest(req, res);

      expect(res.send).toHaveBeenCalledWith(staleSnapshot.buffer);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
        'X-Snapshot-Age': expect.any(Number)
      }));
    });

    it('should handle service errors gracefully', async () => {
      mockServices.snapshotCache.getLatest.mockImplementation(() => {
        throw new Error('Cache service error');
      });

      await snapshotController.getLatest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Snapshot retrieval failed',
        message: 'Internal server error while retrieving snapshot',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getInfo', () => {
    it('should return snapshot and stream info', async () => {
      const mockInfo = {
        hasSnapshot: true,
        lastUpdate: new Date().toISOString(),
        lastUpdateAge: 5000,
        size: 1024,
        streamStatus: 'active',
        error: null,
        historyCount: 5,
        stats: { cacheHits: 10, cacheMisses: 2 }
      };
      mockServices.snapshotCache.getInfo.mockReturnValue(mockInfo);

      await snapshotController.getInfo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        snapshot: {
          available: true,
          lastUpdate: mockInfo.lastUpdate,
          lastUpdateAge: mockInfo.lastUpdateAge,
          size: mockInfo.size,
          streamStatus: mockInfo.streamStatus,
          error: null,
          historyCount: 5
        },
        stream: {
          isRunning: true,
          processId: 12345,
          retryCount: 0,
          frameCount: 100,
          uptime: 60000,
          healthy: true
        },
        cache: {
          stats: mockInfo.stats
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle service errors', async () => {
      mockServices.snapshotCache.getInfo.mockImplementation(() => {
        throw new Error('Info service error');
      });

      await snapshotController.getInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Info retrieval failed',
        message: 'Internal server error while retrieving snapshot info',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', async () => {
      const mockStats = {
        totalSnapshots: 100,
        cacheHits: 80,
        cacheMisses: 20,
        cacheStats: { hits: 80, misses: 20 }
      };
      mockServices.snapshotCache.getStats.mockReturnValue(mockStats);

      await snapshotController.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        cache: mockStats,
        stream: expect.any(Object),
        performance: {
          averageResponseTime: '< 100ms',
          cacheHitRate: 80,
          totalRequests: 100
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle missing cache stats', async () => {
      const mockStats = {
        totalSnapshots: 0,
        cacheStats: null
      };
      mockServices.snapshotCache.getStats.mockReturnValue(mockStats);

      await snapshotController.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        performance: {
          averageResponseTime: '< 100ms',
          cacheHitRate: 0,
          totalRequests: 0
        }
      }));
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      req.params.id = 'test-snapshot-id';
    });

    it('should return snapshot by ID', async () => {
      const mockSnapshot = createMockSnapshot();
      mockServices.snapshotCache.getById.mockReturnValue(mockSnapshot);

      await snapshotController.getById(req, res);

      expect(mockServices.snapshotCache.getById).toHaveBeenCalledWith('test-snapshot-id');
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpeg',
        'Content-Length': mockSnapshot.buffer.length,
        'X-Timestamp': mockSnapshot.timestamp,
        'X-Snapshot-ID': mockSnapshot.id,
        'Cache-Control': 'public, max-age=3600'
      });
      expect(res.send).toHaveBeenCalledWith(mockSnapshot.buffer);
    });

    it('should return 400 for missing ID', async () => {
      req.params.id = '';

      await snapshotController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing snapshot ID',
        message: 'Snapshot ID is required',
        timestamp: expect.any(String)
      });
    });

    it('should return 404 for non-existent ID', async () => {
      mockServices.snapshotCache.getById.mockReturnValue(null);

      await snapshotController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Snapshot not found',
        message: 'No snapshot found with ID: test-snapshot-id',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getList', () => {
    it('should return list of available snapshots', async () => {
      const mockSnapshots = [
        {
          id: 'snap-1',
          timestamp: '2023-01-01T00:00:00Z',
          size: 1024,
          streamStatus: 'active'
        },
        {
          id: 'snap-2',
          timestamp: '2023-01-01T00:01:00Z',
          size: 2048,
          streamStatus: 'active'
        }
      ];
      mockServices.snapshotCache.getAllSnapshots.mockReturnValue(mockSnapshots);

      await snapshotController.getList(req, res);

      expect(res.json).toHaveBeenCalledWith({
        snapshots: expect.arrayContaining([
          expect.objectContaining({
            id: 'snap-1',
            timestamp: '2023-01-01T00:00:00Z',
            size: 1024,
            streamStatus: 'active',
            age: expect.any(Number)
          }),
          expect.objectContaining({
            id: 'snap-2',
            timestamp: '2023-01-01T00:01:00Z',
            size: 2048,
            streamStatus: 'active',
            age: expect.any(Number)
          })
        ]),
        count: 2,
        timestamp: expect.any(String)
      });
    });

    it('should return empty list when no snapshots', async () => {
      mockServices.snapshotCache.getAllSnapshots.mockReturnValue([]);

      await snapshotController.getList(req, res);

      expect(res.json).toHaveBeenCalledWith({
        snapshots: [],
        count: 0,
        timestamp: expect.any(String)
      });
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      req.ip = '192.168.1.100';
      req.get.mockReturnValue('Test User Agent');
    });

    it('should clear snapshot cache successfully', async () => {
      await snapshotController.clearCache(req, res);

      expect(mockServices.snapshotCache.clear).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Snapshot cache cleared successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle cache clear errors', async () => {
      mockServices.snapshotCache.clear.mockImplementation(() => {
        throw new Error('Clear failed');
      });

      await snapshotController.clearCache(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cache clear failed',
        message: 'Internal server error while clearing cache',
        timestamp: expect.any(String)
      });
    });
  });

  describe('error handling', () => {
    it('should handle undefined request objects', async () => {
      req = undefined;

      await expect(snapshotController.getLatest(req, res)).rejects.toThrow();
    });

    it('should handle missing route information', async () => {
      req.route = undefined;
      const mockSnapshot = createMockSnapshot();
      mockServices.snapshotCache.getLatest.mockReturnValue(mockSnapshot);

      await snapshotController.getLatest(req, res);

      expect(res.send).toHaveBeenCalledWith(mockSnapshot.buffer);
    });
  });

  describe('response timing', () => {
    it('should measure response time for successful requests', async () => {
      jest.useFakeTimers();
      const mockSnapshot = createMockSnapshot();
      mockServices.snapshotCache.getLatest.mockReturnValue(mockSnapshot);

      // Start the request
      const promise = snapshotController.getLatest(req, res);
      
      // Advance time and complete
      jest.advanceTimersByTime(50); // 50ms
      await promise;

      expect(res.send).toHaveBeenCalledWith(mockSnapshot.buffer);
      
      jest.useRealTimers();
    });
  });

  describe('request validation', () => {
    it('should handle requests with missing headers', async () => {
      req.get.mockReturnValue(undefined);
      const mockSnapshot = createMockSnapshot();
      mockServices.snapshotCache.getLatest.mockReturnValue(mockSnapshot);

      await snapshotController.getLatest(req, res);

      expect(res.send).toHaveBeenCalledWith(mockSnapshot.buffer);
    });

    it('should handle malformed snapshot data', async () => {
      const malformedSnapshot = {
        buffer: 'not-a-buffer',
        timestamp: 'invalid-date',
        size: 'not-a-number'
      };
      mockServices.snapshotCache.getLatest.mockReturnValue(malformedSnapshot);

      await snapshotController.getLatest(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  });
});
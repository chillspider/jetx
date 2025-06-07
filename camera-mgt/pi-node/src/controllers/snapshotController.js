const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const { asyncHandler } = require('../middleware/errorHandler');

class SnapshotController {
  constructor(services) {
    this.snapshotCache = services.snapshotCache;
    this.streamManager = services.streamManager;
  }

  // Get the latest snapshot image
  getLatest = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
      const snapshot = this.snapshotCache.getLatest();
      
      if (!snapshot) {
        logger.debug('No snapshot available for request');
        return res.status(404).json({
          error: 'No snapshot available',
          message: 'No recent snapshots found in cache',
          timestamp: new Date().toISOString()
        });
      }

      // Check if snapshot is valid
      if (!snapshot.buffer || snapshot.buffer.length === 0) {
        logger.warn('Empty snapshot buffer found');
        return res.status(503).json({
          error: 'Invalid snapshot',
          message: 'Snapshot data is corrupted or empty',
          timestamp: new Date().toISOString()
        });
      }

      // Check snapshot age
      const snapshotAge = Date.now() - new Date(snapshot.timestamp).getTime();
      const maxAge = 60000; // 1 minute
      
      if (snapshotAge > maxAge) {
        logger.warn(`Serving stale snapshot (${snapshotAge}ms old)`);
      }

      // Set response headers
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': snapshot.buffer.length,
        'X-Timestamp': snapshot.timestamp,
        'X-Stream-Status': snapshot.streamStatus,
        'X-Snapshot-Age': snapshotAge,
        'X-Snapshot-ID': snapshot.id,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordApiCall(req.method, req.route?.path || '/api/snapshot', 200, duration);
      
      logger.debug('Served snapshot', {
        size: snapshot.buffer.length,
        age: snapshotAge,
        id: snapshot.id,
        duration: `${duration.toFixed(3)}s`
      });

      res.send(snapshot.buffer);
      
    } catch (error) {
      logger.error('Failed to get snapshot:', error);
      
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordApiCall(req.method, req.route?.path || '/api/snapshot', 500, duration);
      
      res.status(500).json({
        error: 'Snapshot retrieval failed',
        message: 'Internal server error while retrieving snapshot',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get snapshot metadata/info
  getInfo = asyncHandler(async (req, res) => {
    try {
      const info = this.snapshotCache.getInfo();
      const streamStatus = this.streamManager.getStatus();
      
      const response = {
        snapshot: {
          available: info.hasSnapshot,
          lastUpdate: info.lastUpdate,
          lastUpdateAge: info.lastUpdateAge,
          size: info.size,
          streamStatus: info.streamStatus,
          error: info.error,
          historyCount: info.historyCount
        },
        stream: {
          isRunning: streamStatus.isRunning,
          processId: streamStatus.processId,
          retryCount: streamStatus.retryCount,
          frameCount: streamStatus.frameCount,
          uptime: streamStatus.uptime,
          healthy: this.streamManager.isHealthy()
        },
        cache: {
          stats: info.stats
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
      
    } catch (error) {
      logger.error('Failed to get snapshot info:', error);
      
      res.status(500).json({
        error: 'Info retrieval failed',
        message: 'Internal server error while retrieving snapshot info',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get snapshot statistics
  getStats = asyncHandler(async (req, res) => {
    try {
      const stats = this.snapshotCache.getStats();
      const streamStatus = this.streamManager.getStatus();
      
      const response = {
        cache: stats,
        stream: streamStatus,
        performance: {
          averageResponseTime: '< 100ms', // TODO: Calculate actual average
          cacheHitRate: stats.cacheStats?.hits || 0,
          totalRequests: stats.totalSnapshots || 0
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
      
    } catch (error) {
      logger.error('Failed to get snapshot stats:', error);
      
      res.status(500).json({
        error: 'Stats retrieval failed',
        message: 'Internal server error while retrieving snapshot statistics',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get snapshot by ID (for debugging)
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Missing snapshot ID',
        message: 'Snapshot ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const snapshot = this.snapshotCache.getById(id);
      
      if (!snapshot) {
        return res.status(404).json({
          error: 'Snapshot not found',
          message: `No snapshot found with ID: ${id}`,
          timestamp: new Date().toISOString()
        });
      }

      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': snapshot.buffer.length,
        'X-Timestamp': snapshot.timestamp,
        'X-Snapshot-ID': snapshot.id,
        'Cache-Control': 'public, max-age=3600' // Can cache historical snapshots
      });

      res.send(snapshot.buffer);
      
    } catch (error) {
      logger.error('Failed to get snapshot by ID:', error);
      
      res.status(500).json({
        error: 'Snapshot retrieval failed',
        message: 'Internal server error while retrieving snapshot',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get list of available snapshots (metadata only)
  getList = asyncHandler(async (req, res) => {
    try {
      const snapshots = this.snapshotCache.getAllSnapshots();
      
      const response = {
        snapshots: snapshots.map(snapshot => ({
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          size: snapshot.size,
          streamStatus: snapshot.streamStatus,
          age: Date.now() - new Date(snapshot.timestamp).getTime()
        })),
        count: snapshots.length,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
      
    } catch (error) {
      logger.error('Failed to get snapshot list:', error);
      
      res.status(500).json({
        error: 'List retrieval failed',
        message: 'Internal server error while retrieving snapshot list',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Clear snapshot cache (admin operation)
  clearCache = asyncHandler(async (req, res) => {
    try {
      this.snapshotCache.clear();
      
      logger.info('Snapshot cache cleared via API request', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({
        success: true,
        message: 'Snapshot cache cleared successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      
      res.status(500).json({
        error: 'Cache clear failed',
        message: 'Internal server error while clearing cache',
        timestamp: new Date().toISOString()
      });
    }
  });
}

module.exports = SnapshotController;
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const { v4: uuidv4 } = require('uuid');

class SnapshotCache {
  constructor(options = {}) {
    const config = require('../config/default');
    
    this.cache = new NodeCache({
      stdTTL: options.ttl || config.snapshot.cacheTTL,
      checkperiod: options.checkPeriod || 60,
      useClones: false // Don't clone binary data
    });
    
    this.latestKey = 'latest_snapshot';
    this.maxHistorySize = options.maxHistory || config.snapshot.cacheSize;
    this.stats = {
      totalSnapshots: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBytesStored: 0
    };
    
    // Track cache events
    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache expired: ${key}`);
      this.updateCacheSize();
    });
    
    this.cache.on('del', (key, value) => {
      logger.debug(`Cache deleted: ${key}`);
      this.updateCacheSize();
    });
  }

  store(snapshot) {
    try {
      const enrichedSnapshot = {
        ...snapshot,
        id: this.generateId(),
        receivedAt: Date.now()
      };

      // Validate snapshot
      if (!snapshot.buffer || !Buffer.isBuffer(snapshot.buffer)) {
        logger.error('Invalid snapshot buffer');
        return null;
      }

      // Store as latest
      this.cache.set(this.latestKey, enrichedSnapshot);
      
      // Store in history with longer TTL
      const historyKey = `snapshot_${enrichedSnapshot.id}`;
      this.cache.set(historyKey, enrichedSnapshot, 600); // 10 minutes
      
      // Update stats
      this.stats.totalSnapshots++;
      this.stats.totalBytesStored += snapshot.buffer.length;
      
      // Cleanup old snapshots
      this.cleanupHistory();
      
      // Update metrics
      this.updateCacheSize();
      
      logger.debug(`Stored snapshot: ${enrichedSnapshot.size} bytes, id: ${enrichedSnapshot.id}`);
      return enrichedSnapshot.id;
    } catch (error) {
      logger.error('Failed to store snapshot:', error);
      return null;
    }
  }

  getLatest() {
    try {
      const snapshot = this.cache.get(this.latestKey);
      
      if (snapshot) {
        this.stats.cacheHits++;
        logger.debug('Cache hit for latest snapshot');
        return snapshot;
      }
      
      this.stats.cacheMisses++;
      logger.debug('Cache miss for latest snapshot');
      return null;
    } catch (error) {
      logger.error('Failed to get latest snapshot:', error);
      return null;
    }
  }

  getById(id) {
    try {
      const snapshot = this.cache.get(`snapshot_${id}`);
      
      if (snapshot) {
        this.stats.cacheHits++;
        return snapshot;
      }
      
      this.stats.cacheMisses++;
      return null;
    } catch (error) {
      logger.error('Failed to get snapshot by id:', error);
      return null;
    }
  }

  getInfo() {
    const latest = this.cache.get(this.latestKey);
    const allKeys = this.cache.keys();
    const historyCount = allKeys.filter(key => key.startsWith('snapshot_')).length;
    
    return {
      hasSnapshot: !!latest,
      lastUpdate: latest?.timestamp || null,
      lastUpdateAge: latest ? Date.now() - new Date(latest.timestamp).getTime() : null,
      size: latest?.size || 0,
      streamStatus: latest?.streamStatus || 'unknown',
      error: latest?.error || null,
      historyCount: historyCount,
      stats: {
        ...this.stats,
        hitRate: this.stats.cacheHits > 0 
          ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) + '%'
          : '0%',
        averageSnapshotSize: this.stats.totalSnapshots > 0
          ? Math.round(this.stats.totalBytesStored / this.stats.totalSnapshots)
          : 0
      }
    };
  }

  generateId() {
    return `${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  cleanupHistory() {
    try {
      const keys = this.cache.keys()
        .filter(key => key.startsWith('snapshot_'))
        .sort()
        .reverse(); // Newest first
      
      if (keys.length > this.maxHistorySize) {
        const keysToDelete = keys.slice(this.maxHistorySize);
        keysToDelete.forEach(key => {
          this.cache.del(key);
          logger.debug(`Cleaned up old snapshot: ${key}`);
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup history:', error);
    }
  }

  updateCacheSize() {
    try {
      let totalSize = 0;
      const keys = this.cache.keys();
      
      keys.forEach(key => {
        const item = this.cache.get(key);
        if (item && item.buffer) {
          totalSize += item.buffer.length;
        }
      });
      
      metrics.snapshotCacheSize.set(totalSize);
    } catch (error) {
      logger.error('Failed to update cache size metric:', error);
    }
  }

  getStats() {
    const keys = this.cache.keys();
    const memoryUsage = process.memoryUsage();
    
    return {
      ...this.stats,
      cacheStats: this.cache.getStats(),
      currentItems: keys.length,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      }
    };
  }

  clear() {
    this.cache.flushAll();
    logger.info('Snapshot cache cleared');
    this.updateCacheSize();
  }

  // Get all snapshots for debugging/testing
  getAllSnapshots() {
    const snapshots = [];
    const keys = this.cache.keys().filter(key => key.startsWith('snapshot_'));
    
    keys.forEach(key => {
      const snapshot = this.cache.get(key);
      if (snapshot) {
        snapshots.push({
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          size: snapshot.size,
          streamStatus: snapshot.streamStatus
        });
      }
    });
    
    return snapshots.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

module.exports = SnapshotCache;
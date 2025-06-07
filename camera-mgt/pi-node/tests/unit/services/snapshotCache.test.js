const SnapshotCache = require('../../../src/services/snapshotCache');

describe('SnapshotCache', () => {
  let snapshotCache;
  let mockConfig;

  beforeEach(() => {
    mockConfig = createMockConfig();
    
    // Mock the require for config
    jest.doMock('../../../src/config/default', () => mockConfig);
    
    snapshotCache = new SnapshotCache({
      ttl: mockConfig.snapshot.cacheTTL,
      maxHistory: mockConfig.snapshot.cacheSize
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(snapshotCache.maxHistorySize).toBe(mockConfig.snapshot.cacheSize);
      expect(snapshotCache.stats.totalSnapshots).toBe(0);
      expect(snapshotCache.stats.cacheHits).toBe(0);
      expect(snapshotCache.stats.cacheMisses).toBe(0);
    });

    it('should use default options when not provided', () => {
      const defaultCache = new SnapshotCache();
      expect(defaultCache.maxHistorySize).toBeDefined();
    });
  });

  describe('store', () => {
    it('should store a valid snapshot', () => {
      const snapshot = createMockSnapshot();
      
      const id = snapshotCache.store(snapshot);
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(snapshotCache.stats.totalSnapshots).toBe(1);
    });

    it('should reject invalid snapshot without buffer', () => {
      const invalidSnapshot = {
        timestamp: new Date().toISOString(),
        size: 1024,
        streamStatus: 'active'
      };
      
      const id = snapshotCache.store(invalidSnapshot);
      
      expect(id).toBeNull();
      expect(snapshotCache.stats.totalSnapshots).toBe(0);
    });

    it('should reject snapshot with non-buffer data', () => {
      const invalidSnapshot = {
        buffer: 'not-a-buffer',
        timestamp: new Date().toISOString(),
        size: 1024,
        streamStatus: 'active'
      };
      
      const id = snapshotCache.store(invalidSnapshot);
      
      expect(id).toBeNull();
    });

    it('should store snapshot as latest', () => {
      const snapshot = createMockSnapshot();
      
      snapshotCache.store(snapshot);
      const latest = snapshotCache.getLatest();
      
      expect(latest).toBeDefined();
      expect(latest.buffer).toEqual(snapshot.buffer);
      expect(latest.timestamp).toBe(snapshot.timestamp);
    });

    it('should update statistics on store', () => {
      const snapshot = createMockSnapshot();
      const initialBytes = snapshotCache.stats.totalBytesStored;
      
      snapshotCache.store(snapshot);
      
      expect(snapshotCache.stats.totalSnapshots).toBe(1);
      expect(snapshotCache.stats.totalBytesStored).toBe(initialBytes + snapshot.buffer.length);
    });
  });

  describe('getLatest', () => {
    it('should return null when no snapshots stored', () => {
      const latest = snapshotCache.getLatest();
      
      expect(latest).toBeNull();
      expect(snapshotCache.stats.cacheMisses).toBe(1);
    });

    it('should return the latest snapshot', () => {
      const snapshot = createMockSnapshot();
      snapshotCache.store(snapshot);
      
      const latest = snapshotCache.getLatest();
      
      expect(latest).toBeDefined();
      expect(latest.buffer).toEqual(snapshot.buffer);
      expect(snapshotCache.stats.cacheHits).toBe(1);
    });

    it('should return the most recent snapshot when multiple stored', () => {
      const snapshot1 = createMockSnapshot();
      const snapshot2 = { ...createMockSnapshot(), timestamp: new Date().toISOString() };
      
      snapshotCache.store(snapshot1);
      snapshotCache.store(snapshot2);
      
      const latest = snapshotCache.getLatest();
      
      expect(latest.timestamp).toBe(snapshot2.timestamp);
    });
  });

  describe('getById', () => {
    it('should return null for non-existent ID', () => {
      const snapshot = snapshotCache.getById('non-existent');
      
      expect(snapshot).toBeNull();
      expect(snapshotCache.stats.cacheMisses).toBe(1);
    });

    it('should return snapshot by ID', () => {
      const snapshot = createMockSnapshot();
      const id = snapshotCache.store(snapshot);
      
      const retrieved = snapshotCache.getById(id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(id);
      expect(snapshotCache.stats.cacheHits).toBe(1);
    });
  });

  describe('getInfo', () => {
    it('should return info when no snapshots', () => {
      const info = snapshotCache.getInfo();
      
      expect(info).toEqual({
        hasSnapshot: false,
        lastUpdate: null,
        lastUpdateAge: null,
        size: 0,
        streamStatus: 'unknown',
        error: null,
        historyCount: 0,
        stats: expect.objectContaining({
          totalSnapshots: 0,
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: '0%',
          averageSnapshotSize: 0
        })
      });
    });

    it('should return correct info when snapshots exist', () => {
      const snapshot = createMockSnapshot();
      snapshotCache.store(snapshot);
      
      const info = snapshotCache.getInfo();
      
      expect(info.hasSnapshot).toBe(true);
      expect(info.lastUpdate).toBe(snapshot.timestamp);
      expect(info.size).toBe(snapshot.size);
      expect(info.streamStatus).toBe(snapshot.streamStatus);
      expect(info.historyCount).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      const snapshot = createMockSnapshot();
      snapshotCache.store(snapshot);
      
      // Generate some hits and misses
      snapshotCache.getLatest(); // hit
      snapshotCache.getById('non-existent'); // miss
      snapshotCache.getLatest(); // hit
      
      const info = snapshotCache.getInfo();
      
      expect(info.stats.hitRate).toBe('66.67%'); // 2 hits out of 3 total
    });
  });

  describe('cleanupHistory', () => {
    it('should remove old snapshots when exceeding max history', () => {
      const maxHistory = 3;
      snapshotCache.maxHistorySize = maxHistory;
      
      // Store more snapshots than max history
      for (let i = 0; i < maxHistory + 2; i++) {
        const snapshot = createMockSnapshot();
        snapshotCache.store(snapshot);
      }
      
      const allSnapshots = snapshotCache.getAllSnapshots();
      
      expect(allSnapshots.length).toBeLessThanOrEqual(maxHistory);
    });

    it('should keep most recent snapshots', () => {
      const maxHistory = 2;
      snapshotCache.maxHistorySize = maxHistory;
      
      const snapshot1 = { ...createMockSnapshot(), timestamp: '2023-01-01T00:00:00Z' };
      const snapshot2 = { ...createMockSnapshot(), timestamp: '2023-01-02T00:00:00Z' };
      const snapshot3 = { ...createMockSnapshot(), timestamp: '2023-01-03T00:00:00Z' };
      
      snapshotCache.store(snapshot1);
      snapshotCache.store(snapshot2);
      snapshotCache.store(snapshot3);
      
      const allSnapshots = snapshotCache.getAllSnapshots();
      
      expect(allSnapshots.length).toBe(maxHistory);
      expect(allSnapshots[0].timestamp).toBe(snapshot3.timestamp);
      expect(allSnapshots[1].timestamp).toBe(snapshot2.timestamp);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', () => {
      const snapshot = createMockSnapshot();
      snapshotCache.store(snapshot);
      
      const stats = snapshotCache.getStats();
      
      expect(stats).toHaveProperty('totalSnapshots', 1);
      expect(stats).toHaveProperty('cacheHits');
      expect(stats).toHaveProperty('cacheMisses');
      expect(stats).toHaveProperty('totalBytesStored');
      expect(stats).toHaveProperty('cacheStats');
      expect(stats).toHaveProperty('currentItems');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats.memoryUsage).toHaveProperty('rss');
      expect(stats.memoryUsage).toHaveProperty('heapUsed');
    });
  });

  describe('clear', () => {
    it('should clear all snapshots from cache', () => {
      const snapshot = createMockSnapshot();
      snapshotCache.store(snapshot);
      
      expect(snapshotCache.getLatest()).toBeDefined();
      
      snapshotCache.clear();
      
      expect(snapshotCache.getLatest()).toBeNull();
    });
  });

  describe('getAllSnapshots', () => {
    it('should return empty array when no snapshots', () => {
      const snapshots = snapshotCache.getAllSnapshots();
      
      expect(snapshots).toEqual([]);
    });

    it('should return all snapshots sorted by timestamp (newest first)', () => {
      const snapshot1 = { ...createMockSnapshot(), timestamp: '2023-01-01T00:00:00Z' };
      const snapshot2 = { ...createMockSnapshot(), timestamp: '2023-01-02T00:00:00Z' };
      const snapshot3 = { ...createMockSnapshot(), timestamp: '2023-01-03T00:00:00Z' };
      
      snapshotCache.store(snapshot1);
      snapshotCache.store(snapshot2);
      snapshotCache.store(snapshot3);
      
      const snapshots = snapshotCache.getAllSnapshots();
      
      expect(snapshots).toHaveLength(3);
      expect(snapshots[0].timestamp).toBe(snapshot3.timestamp);
      expect(snapshots[1].timestamp).toBe(snapshot2.timestamp);
      expect(snapshots[2].timestamp).toBe(snapshot1.timestamp);
    });

    it('should not include buffer data in snapshot list', () => {
      const snapshot = createMockSnapshot();
      snapshotCache.store(snapshot);
      
      const snapshots = snapshotCache.getAllSnapshots();
      
      expect(snapshots[0]).not.toHaveProperty('buffer');
      expect(snapshots[0]).toHaveProperty('id');
      expect(snapshots[0]).toHaveProperty('timestamp');
      expect(snapshots[0]).toHaveProperty('size');
      expect(snapshots[0]).toHaveProperty('streamStatus');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = snapshotCache.generateId();
      const id2 = snapshotCache.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate IDs with timestamp prefix', () => {
      const before = Date.now();
      const id = snapshotCache.generateId();
      const after = Date.now();
      
      const timestamp = parseInt(id.split('_')[0]);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('error handling', () => {
    it('should handle errors in store gracefully', () => {
      // Mock cache.set to throw error
      jest.spyOn(snapshotCache.cache, 'set').mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      const snapshot = createMockSnapshot();
      const id = snapshotCache.store(snapshot);
      
      expect(id).toBeNull();
    });

    it('should handle errors in getLatest gracefully', () => {
      // Mock cache.get to throw error
      jest.spyOn(snapshotCache.cache, 'get').mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      const latest = snapshotCache.getLatest();
      
      expect(latest).toBeNull();
    });
  });
});
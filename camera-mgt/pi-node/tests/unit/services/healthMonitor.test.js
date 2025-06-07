const si = require('systeminformation');
const HealthMonitor = require('../../../src/services/healthMonitor');

describe('HealthMonitor', () => {
  let healthMonitor;
  let mockServices;

  beforeEach(() => {
    mockServices = {
      configManager: {
        getConfig: jest.fn(() => createMockConfig()),
        on: jest.fn()
      },
      streamManager: {
        getStatus: jest.fn(() => ({
          isRunning: true,
          processId: 12345,
          retryCount: 0,
          lastFrameTime: Date.now(),
          frameCount: 100,
          uptime: 60000,
          streamUrl: 'rtsp://test.com/stream'
        })),
        isHealthy: jest.fn(() => true),
        on: jest.fn(),
        stop: jest.fn(),
        start: jest.fn().mockResolvedValue()
      },
      snapshotCache: {
        getInfo: jest.fn(() => ({
          hasSnapshot: true,
          lastUpdate: new Date().toISOString(),
          lastUpdateAge: 5000,
          size: 1024,
          streamStatus: 'active',
          historyCount: 5,
          stats: { cacheHits: 10, cacheMisses: 2 }
        })),
        getStats: jest.fn(() => ({
          totalSnapshots: 100,
          cacheStats: { hits: 80, misses: 20 }
        })),
        clear: jest.fn()
      }
    };

    healthMonitor = new HealthMonitor(mockServices);
  });

  afterEach(() => {
    if (healthMonitor) {
      healthMonitor.stop();
    }
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(healthMonitor.services).toBe(mockServices);
      expect(healthMonitor.config).toBeDefined();
      expect(healthMonitor.healthStatus.overall).toBe('healthy');
      expect(healthMonitor.stats).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start monitoring intervals', async () => {
      jest.useFakeTimers();
      const checkHealthSpy = jest.spyOn(healthMonitor, 'checkHealth').mockResolvedValue();
      const collectMetricsSpy = jest.spyOn(healthMonitor, 'collectSystemMetrics').mockResolvedValue();

      await healthMonitor.start();

      expect(checkHealthSpy).toHaveBeenCalled();
      expect(healthMonitor.monitoringInterval).toBeDefined();
      expect(healthMonitor.healthCheckInterval).toBeDefined();

      jest.useRealTimers();
    });

    it('should setup service listeners', async () => {
      await healthMonitor.start();

      expect(mockServices.streamManager.on).toHaveBeenCalledWith('frameReceived', expect.any(Function));
      expect(mockServices.streamManager.on).toHaveBeenCalledWith('streamError', expect.any(Function));
      expect(mockServices.streamManager.on).toHaveBeenCalledWith('streamFailed', expect.any(Function));
    });
  });

  describe('collectSystemMetrics', () => {
    beforeEach(() => {
      si.currentLoad.mockResolvedValue({ currentLoad: 45.2 });
      si.cpuTemperature.mockResolvedValue({ main: 52.3 });
      si.mem.mockResolvedValue({
        used: 512000000,
        total: 1024000000
      });
      si.fsSize.mockResolvedValue([{
        mount: '/',
        size: 10000000000,
        used: 5000000000,
        use: 50
      }]);
      si.networkStats.mockResolvedValue([{
        rx_bytes: 1000000,
        tx_bytes: 500000
      }]);
      si.time.mockResolvedValue({ uptime: 86400 });
    });

    it('should collect all system metrics', async () => {
      await healthMonitor.collectSystemMetrics();

      expect(healthMonitor.stats.cpu.usage).toBe(45.2);
      expect(healthMonitor.stats.cpu.temperature).toBe(52.3);
      expect(healthMonitor.stats.memory.used).toBe(512000000);
      expect(healthMonitor.stats.memory.total).toBe(1024000000);
      expect(healthMonitor.stats.memory.percentage).toBe(50);
      expect(healthMonitor.stats.disk.percentage).toBe(50);
      expect(healthMonitor.stats.uptime).toBe(86400);
    });

    it('should handle errors in metric collection', async () => {
      si.currentLoad.mockRejectedValue(new Error('CPU metrics failed'));

      await expect(healthMonitor.collectSystemMetrics()).resolves.not.toThrow();
    });
  });

  describe('checkSystemThresholds', () => {
    it('should detect critical temperature', () => {
      healthMonitor.stats.cpu.temperature = 85; // Above critical (80)
      healthMonitor.config.monitoring.temperature.critical = 80;

      healthMonitor.checkSystemThresholds();

      expect(healthMonitor.healthStatus.system).toBe('critical');
      expect(healthMonitor.healthStatus.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'temperature',
            severity: 'critical'
          })
        ])
      );
    });

    it('should detect warning temperature', () => {
      healthMonitor.stats.cpu.temperature = 75; // Above warning (70) but below critical (80)
      healthMonitor.config.monitoring.temperature.warning = 70;
      healthMonitor.config.monitoring.temperature.critical = 80;

      healthMonitor.checkSystemThresholds();

      expect(healthMonitor.healthStatus.system).toBe('warning');
    });

    it('should detect critical memory usage', () => {
      healthMonitor.stats.memory.percentage = 95; // Above critical (90)
      healthMonitor.config.monitoring.memory.critical = 90;

      healthMonitor.checkSystemThresholds();

      expect(healthMonitor.healthStatus.system).toBe('critical');
    });

    it('should detect critical disk usage', () => {
      healthMonitor.stats.disk.percentage = 95; // Above critical (90)
      healthMonitor.config.monitoring.disk.critical = 90;

      healthMonitor.checkSystemThresholds();

      expect(healthMonitor.healthStatus.system).toBe('critical');
    });

    it('should emit critical issue events', () => {
      const emitSpy = jest.spyOn(healthMonitor, 'emit');
      healthMonitor.stats.cpu.temperature = 85;
      healthMonitor.config.monitoring.temperature.critical = 80;

      healthMonitor.checkSystemThresholds();

      expect(emitSpy).toHaveBeenCalledWith('criticalIssue', expect.objectContaining({
        type: 'temperature',
        severity: 'critical'
      }));
    });

    it('should set system to healthy when no issues', () => {
      healthMonitor.stats.cpu.temperature = 50; // Below thresholds
      healthMonitor.stats.memory.percentage = 60;
      healthMonitor.stats.disk.percentage = 60;

      healthMonitor.checkSystemThresholds();

      expect(healthMonitor.healthStatus.system).toBe('healthy');
    });
  });

  describe('checkHealth', () => {
    it('should check stream health when running', async () => {
      mockServices.streamManager.getStatus.mockReturnValue({
        isRunning: true
      });
      mockServices.streamManager.isHealthy.mockReturnValue(true);

      await healthMonitor.checkHealth();

      expect(healthMonitor.healthStatus.stream).toBe('healthy');
    });

    it('should detect stopped stream', async () => {
      mockServices.streamManager.getStatus.mockReturnValue({
        isRunning: false
      });

      await healthMonitor.checkHealth();

      expect(healthMonitor.healthStatus.stream).toBe('stopped');
    });

    it('should detect unhealthy stream', async () => {
      mockServices.streamManager.getStatus.mockReturnValue({
        isRunning: true
      });
      mockServices.streamManager.isHealthy.mockReturnValue(false);

      await healthMonitor.checkHealth();

      expect(healthMonitor.healthStatus.stream).toBe('unhealthy');
    });

    it('should check snapshot cache health', async () => {
      mockServices.snapshotCache.getInfo.mockReturnValue({
        hasSnapshot: false
      });

      await healthMonitor.checkHealth();

      expect(healthMonitor.healthStatus.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            component: 'snapshot',
            message: 'No snapshots available'
          })
        ])
      );
    });

    it('should detect stale snapshots', async () => {
      mockServices.snapshotCache.getInfo.mockReturnValue({
        hasSnapshot: true,
        lastUpdateAge: 120000 // 2 minutes old
      });

      await healthMonitor.checkHealth();

      expect(healthMonitor.healthStatus.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            component: 'snapshot',
            message: 'Snapshots are stale'
          })
        ])
      );
    });

    it('should handle health check errors', async () => {
      mockServices.streamManager.getStatus.mockImplementation(() => {
        throw new Error('Service error');
      });

      await healthMonitor.checkHealth();

      expect(healthMonitor.healthStatus.overall).toBe('error');
    });
  });

  describe('updateOverallHealth', () => {
    it('should set overall health to critical when stream failed', () => {
      healthMonitor.healthStatus.stream = 'failed';
      healthMonitor.healthStatus.api = 'healthy';
      healthMonitor.healthStatus.system = 'healthy';

      healthMonitor.updateOverallHealth();

      expect(healthMonitor.healthStatus.overall).toBe('critical');
    });

    it('should set overall health to unhealthy when stream unhealthy', () => {
      healthMonitor.healthStatus.stream = 'unhealthy';
      healthMonitor.healthStatus.api = 'healthy';
      healthMonitor.healthStatus.system = 'healthy';

      healthMonitor.updateOverallHealth();

      expect(healthMonitor.healthStatus.overall).toBe('unhealthy');
    });

    it('should set overall health to warning when system warning', () => {
      healthMonitor.healthStatus.stream = 'healthy';
      healthMonitor.healthStatus.api = 'healthy';
      healthMonitor.healthStatus.system = 'warning';

      healthMonitor.updateOverallHealth();

      expect(healthMonitor.healthStatus.overall).toBe('warning');
    });

    it('should set overall health to healthy when all healthy', () => {
      healthMonitor.healthStatus.stream = 'healthy';
      healthMonitor.healthStatus.api = 'healthy';
      healthMonitor.healthStatus.system = 'healthy';

      healthMonitor.updateOverallHealth();

      expect(healthMonitor.healthStatus.overall).toBe('healthy');
    });
  });

  describe('addIssue', () => {
    it('should add new issue', () => {
      healthMonitor.addIssue('test', 'Test message', 'error');

      expect(healthMonitor.healthStatus.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            component: 'test',
            message: 'Test message',
            severity: 'error',
            timestamp: expect.any(Number)
          })
        ])
      );
    });

    it('should not add duplicate issues', () => {
      healthMonitor.addIssue('test', 'Test message', 'error');
      healthMonitor.addIssue('test', 'Test message', 'error');

      const testIssues = healthMonitor.healthStatus.issues.filter(
        issue => issue.component === 'test' && issue.message === 'Test message'
      );

      expect(testIssues).toHaveLength(1);
    });

    it('should use default severity', () => {
      healthMonitor.addIssue('test', 'Test message');

      expect(healthMonitor.healthStatus.issues[0].severity).toBe('error');
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const health = healthMonitor.getHealth();

      expect(health).toEqual({
        status: 'healthy',
        components: {
          stream: 'unknown',
          api: 'healthy',
          system: 'healthy'
        },
        issues: [],
        timestamp: expect.any(String)
      });
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      healthMonitor.stats = {
        cpu: { usage: 45.2, temperature: 52.3 },
        memory: { used: 512000000, total: 1024000000, percentage: 50 },
        disk: { used: 5000000000, total: 10000000000, percentage: 50 },
        network: { rx: 1000000, tx: 500000 },
        uptime: 86400
      };
    });

    it('should return formatted system stats', () => {
      const stats = healthMonitor.getStats();

      expect(stats.system.cpu.usage).toBe('45.2%');
      expect(stats.system.cpu.temperature).toBe('52.3°C');
      expect(stats.system.memory.used).toBe('488 MB');
      expect(stats.system.memory.total).toBe('977 MB');
      expect(stats.system.memory.percentage).toBe('50.0%');
      expect(stats.system.uptime).toBe('1d');
    });

    it('should include service stats', () => {
      const stats = healthMonitor.getStats();

      expect(stats.services.stream).toBeDefined();
      expect(stats.services.cache).toBeDefined();
      expect(stats.services.config).toBeDefined();
    });
  });

  describe('formatUptime', () => {
    it('should format seconds correctly', () => {
      expect(healthMonitor.formatUptime(60)).toBe('1m');
      expect(healthMonitor.formatUptime(3600)).toBe('1h');
      expect(healthMonitor.formatUptime(86400)).toBe('1d');
      expect(healthMonitor.formatUptime(90061)).toBe('1d 1h 1m');
      expect(healthMonitor.formatUptime(0)).toBe('0m');
    });
  });

  describe('performSelfHealing', () => {
    it('should restart stream when failed', async () => {
      healthMonitor.healthStatus.stream = 'failed';

      await healthMonitor.performSelfHealing();

      expect(mockServices.streamManager.stop).toHaveBeenCalled();
      // Note: start is called with setTimeout, so we'd need to mock timers to test it fully
    });

    it('should clear cache when memory critical', async () => {
      healthMonitor.stats.memory.percentage = 95;
      healthMonitor.config.monitoring.memory.critical = 90;

      await healthMonitor.performSelfHealing();

      expect(mockServices.snapshotCache.clear).toHaveBeenCalled();
    });

    it('should not restart stream when healthy', async () => {
      healthMonitor.healthStatus.stream = 'healthy';

      await healthMonitor.performSelfHealing();

      expect(mockServices.streamManager.stop).not.toHaveBeenCalled();
    });
  });

  describe('service event handling', () => {
    it('should handle frameReceived event', async () => {
      await healthMonitor.start();

      // Find and call the frameReceived handler
      const frameHandler = mockServices.streamManager.on.mock.calls
        .find(call => call[0] === 'frameReceived')[1];
      
      frameHandler();

      expect(healthMonitor.healthStatus.stream).toBe('healthy');
    });

    it('should handle streamError event', async () => {
      await healthMonitor.start();

      const errorHandler = mockServices.streamManager.on.mock.calls
        .find(call => call[0] === 'streamError')[1];
      
      errorHandler('Test error');

      expect(healthMonitor.healthStatus.stream).toBe('error');
    });

    it('should handle streamFailed event', async () => {
      await healthMonitor.start();

      const failedHandler = mockServices.streamManager.on.mock.calls
        .find(call => call[0] === 'streamFailed')[1];
      
      failedHandler('Test failure');

      expect(healthMonitor.healthStatus.stream).toBe('failed');
    });
  });

  describe('stop', () => {
    it('should clear intervals and stop monitoring', () => {
      healthMonitor.monitoringInterval = setInterval(() => {}, 1000);
      healthMonitor.healthCheckInterval = setInterval(() => {}, 1000);

      healthMonitor.stop();

      expect(clearInterval).toHaveBeenCalledTimes(2);
    });

    it('should handle missing intervals', () => {
      healthMonitor.monitoringInterval = null;
      healthMonitor.healthCheckInterval = null;

      expect(() => healthMonitor.stop()).not.toThrow();
    });
  });

  describe('issue cleanup', () => {
    it('should remove old issues during health check', async () => {
      // Add an old issue
      healthMonitor.healthStatus.issues.push({
        component: 'test',
        message: 'Old issue',
        timestamp: Date.now() - 400000 // 400 seconds ago
      });

      await healthMonitor.checkHealth();

      // Issue should be removed (older than 5 minutes)
      expect(healthMonitor.healthStatus.issues).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Old issue'
          })
        ])
      );
    });

    it('should keep recent issues', async () => {
      // Add a recent issue
      healthMonitor.healthStatus.issues.push({
        component: 'test',
        message: 'Recent issue',
        timestamp: Date.now() - 60000 // 1 minute ago
      });

      await healthMonitor.checkHealth();

      // Issue should be kept
      expect(healthMonitor.healthStatus.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Recent issue'
          })
        ])
      );
    });
  });
});
const fs = require('fs').promises;
const axios = require('axios');
const chokidar = require('chokidar');
const ConfigManager = require('../../../src/services/configManager');

describe('ConfigManager', () => {
  let configManager;
  let mockWatcher;

  beforeEach(() => {
    mockWatcher = {
      on: jest.fn(),
      close: jest.fn()
    };
    chokidar.watch.mockReturnValue(mockWatcher);
    
    configManager = new ConfigManager();
  });

  afterEach(() => {
    if (configManager) {
      configManager.stop();
    }
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    beforeEach(() => {
      // Mock config files
      jest.doMock('../../../src/config/default', () => createMockConfig());
      jest.doMock('../../../src/config/production', () => ({}));
    });

    it('should initialize with default configuration', async () => {
      fs.access.mockResolvedValue(); // File exists
      fs.readFile.mockResolvedValue(JSON.stringify({ test: 'local-config' }));

      await configManager.initialize();

      expect(configManager.config).toBeDefined();
      expect(configManager.config.stream).toBeDefined();
      expect(configManager.config.snapshot).toBeDefined();
    });

    it('should start file watcher', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('{}');

      await configManager.initialize();

      expect(chokidar.watch).toHaveBeenCalled();
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should start cloud sync if enabled', async () => {
      jest.useFakeTimers();
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('{}');
      const syncSpy = jest.spyOn(configManager, 'syncWithCloud').mockResolvedValue();

      await configManager.initialize();

      expect(syncSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should handle missing local config file', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));

      await configManager.initialize();

      expect(configManager.config).toBeDefined();
    });

    it('should handle invalid JSON in local config', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('invalid-json');

      await configManager.initialize();

      expect(configManager.config).toBeDefined();
    });
  });

  describe('loadLocalConfig', () => {
    it('should load valid local configuration', async () => {
      const localConfig = { stream: { rtspUrl: 'rtsp://local.test/stream' } };
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify(localConfig));

      await configManager.loadLocalConfig();

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should handle missing local config file gracefully', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));

      await expect(configManager.loadLocalConfig()).resolves.not.toThrow();
    });

    it('should handle invalid JSON gracefully', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('invalid-json');

      await expect(configManager.loadLocalConfig()).resolves.not.toThrow();
    });
  });

  describe('saveLocalConfig', () => {
    it('should save configuration to file', async () => {
      const config = createMockConfig();
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      await configManager.saveLocalConfig(config);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"stream"'),
        'utf8'
      );
    });

    it('should handle write errors', async () => {
      const config = createMockConfig();
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(configManager.saveLocalConfig(config)).rejects.toThrow('Write failed');
    });
  });

  describe('syncWithCloud', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should sync configuration from cloud successfully', async () => {
      const cloudConfig = {
        configuration: {
          stream: { rtspUrl: 'rtsp://cloud.test/stream' }
        }
      };
      axios.get.mockResolvedValue({ data: cloudConfig });
      const saveSpy = jest.spyOn(configManager, 'saveLocalConfig').mockResolvedValue();

      await configManager.syncWithCloud();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/devices/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.any(String),
            'X-Device-ID': expect.any(String)
          })
        })
      );
      expect(saveSpy).toHaveBeenCalled();
      expect(configManager.syncErrors).toBe(0);
    });

    it('should handle cloud sync errors', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await configManager.syncWithCloud();

      expect(configManager.syncErrors).toBe(1);
    });

    it('should handle invalid cloud configuration', async () => {
      const invalidConfig = {
        configuration: {
          stream: { rtspUrl: 'invalid-url' } // Invalid URL
        }
      };
      axios.get.mockResolvedValue({ data: invalidConfig });

      await configManager.syncWithCloud();

      expect(configManager.syncErrors).toBe(1);
    });

    it('should reduce sync frequency after multiple errors', async () => {
      jest.useFakeTimers();
      configManager.config = createMockConfig();
      configManager.syncErrors = 6; // More than 5 errors
      axios.get.mockRejectedValue(new Error('Network error'));

      await configManager.syncWithCloud();

      // Should set interval to 5x slower
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        configManager.config.cloud.syncInterval * 5
      );

      jest.useRealTimers();
    });
  });

  describe('reload', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should reload configuration successfully', async () => {
      const loadSpy = jest.spyOn(configManager, 'loadLocalConfig').mockResolvedValue();
      const validateSpy = jest.spyOn(configManager, 'validateConfig').mockResolvedValue();
      const emitSpy = jest.spyOn(configManager, 'emit');

      await configManager.reload();

      expect(loadSpy).toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('configReloaded', expect.any(Object), expect.any(Object));
    });

    it('should handle reload errors', async () => {
      jest.spyOn(configManager, 'loadLocalConfig').mockRejectedValue(new Error('Load failed'));
      const emitSpy = jest.spyOn(configManager, 'emit');

      await configManager.reload();

      expect(emitSpy).toHaveBeenCalledWith('configReloadError', expect.any(Error));
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should update configuration successfully', async () => {
      const updates = {
        snapshot: { interval: 20 }
      };
      const saveSpy = jest.spyOn(configManager, 'saveLocalConfig').mockResolvedValue();
      const validateSpy = jest.spyOn(configManager, 'validateConfig').mockResolvedValue();
      const emitSpy = jest.spyOn(configManager, 'emit');

      const result = await configManager.updateConfig(updates);

      expect(result).toBe(true);
      expect(configManager.config.snapshot.interval).toBe(20);
      expect(saveSpy).toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('configUpdated', expect.any(Object));
    });

    it('should handle validation errors', async () => {
      const invalidUpdates = {
        stream: { rtspUrl: 'invalid-url' }
      };

      await expect(configManager.updateConfig(invalidUpdates)).rejects.toThrow();
    });
  });

  describe('mergeConfig', () => {
    it('should merge configurations correctly', () => {
      const baseConfig = {
        stream: { rtspUrl: 'rtsp://base.test/stream', timeout: 1000 },
        api: { key: 'base-key' }
      };
      const override = {
        stream: { rtspUrl: 'rtsp://override.test/stream' },
        snapshot: { interval: 15 }
      };

      const merged = configManager.mergeConfig(baseConfig, override);

      expect(merged.stream.rtspUrl).toBe('rtsp://override.test/stream');
      expect(merged.stream.timeout).toBe(1000); // Should keep base value
      expect(merged.api.key).toBe('base-key');
      expect(merged.snapshot.interval).toBe(15);
    });

    it('should handle null and undefined values', () => {
      const baseConfig = { api: { key: 'test' } };
      const override = { api: { key: null }, snapshot: undefined };

      const merged = configManager.mergeConfig(baseConfig, override);

      expect(merged.api.key).toBe('test'); // Should keep original
      expect(merged.snapshot).toBeUndefined();
    });
  });

  describe('getter methods', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should get configuration value by path', () => {
      const rtspUrl = configManager.get('stream.rtspUrl');
      const interval = configManager.get('snapshot.interval');

      expect(rtspUrl).toBe(configManager.config.stream.rtspUrl);
      expect(interval).toBe(configManager.config.snapshot.interval);
    });

    it('should return undefined for invalid path', () => {
      const value = configManager.get('invalid.path');

      expect(value).toBeUndefined();
    });

    it('should get stream configuration', () => {
      const streamConfig = configManager.getStreamConfig();

      expect(streamConfig).toEqual(configManager.config.stream);
      expect(streamConfig).not.toBe(configManager.config.stream); // Should be a copy
    });

    it('should get snapshot configuration', () => {
      const snapshotConfig = configManager.getSnapshotConfig();

      expect(snapshotConfig).toEqual(configManager.config.snapshot);
    });

    it('should get cloud configuration', () => {
      const cloudConfig = configManager.getCloudConfig();

      expect(cloudConfig).toEqual(configManager.config.cloud);
    });
  });

  describe('setter method', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should set configuration value by path', () => {
      configManager.set('stream.rtspUrl', 'rtsp://new.test/stream');
      configManager.set('snapshot.interval', 25);

      expect(configManager.config.stream.rtspUrl).toBe('rtsp://new.test/stream');
      expect(configManager.config.snapshot.interval).toBe(25);
    });

    it('should create nested objects if they do not exist', () => {
      configManager.set('new.nested.value', 'test');

      expect(configManager.config.new.nested.value).toBe('test');
    });
  });

  describe('sanitizeConfig', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should hide sensitive information', () => {
      const config = {
        api: { key: 'secret-api-key' },
        stream: { rtspUrl: 'rtsp://user:password@camera.test/stream' }
      };

      const sanitized = configManager.sanitizeConfig(config);

      expect(sanitized.api.key).toBe('***');
      expect(sanitized.stream.rtspUrl).toBe('rtsp://user:***@camera.test/stream');
    });

    it('should not modify original config', () => {
      const config = {
        api: { key: 'secret-api-key' },
        stream: { rtspUrl: 'rtsp://user:password@camera.test/stream' }
      };
      const originalKey = config.api.key;

      configManager.sanitizeConfig(config);

      expect(config.api.key).toBe(originalKey);
    });
  });

  describe('getStatus', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should return current status', () => {
      const status = configManager.getStatus();

      expect(status).toEqual({
        lastSyncTime: configManager.lastSyncTime,
        syncErrors: configManager.syncErrors,
        configPath: configManager.configPath,
        cloudSyncEnabled: configManager.config.cloud.syncInterval > 0
      });
    });
  });

  describe('stop', () => {
    it('should stop watcher and sync timer', () => {
      configManager.watcher = mockWatcher;
      configManager.syncTimer = setInterval(() => {}, 1000);

      configManager.stop();

      expect(mockWatcher.close).toHaveBeenCalled();
      expect(clearInterval).toHaveBeenCalled();
    });

    it('should handle missing watcher and timer', () => {
      configManager.watcher = null;
      configManager.syncTimer = null;

      expect(() => configManager.stop()).not.toThrow();
    });
  });

  describe('file watcher', () => {
    it('should trigger reload on file change', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('{}');
      const reloadSpy = jest.spyOn(configManager, 'reload').mockResolvedValue();

      await configManager.initialize();

      // Simulate file change
      const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
      await changeHandler();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      configManager.config = createMockConfig();
    });

    it('should validate correct configuration', async () => {
      await expect(configManager.validateConfig()).resolves.not.toThrow();
    });

    it('should reject invalid RTSP URL', async () => {
      configManager.config.stream.rtspUrl = 'invalid-url';

      await expect(configManager.validateConfig()).rejects.toThrow();
    });

    it('should reject invalid snapshot interval', async () => {
      configManager.config.snapshot.interval = 500; // Too high

      await expect(configManager.validateConfig()).rejects.toThrow();
    });
  });
});
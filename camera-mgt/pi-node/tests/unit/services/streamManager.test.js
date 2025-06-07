const { spawn } = require('child_process');
const EventEmitter = require('events');
const StreamManager = require('../../../src/services/streamManager');

describe('StreamManager', () => {
  let streamManager;
  let mockSnapshotCache;
  let mockConfig;
  let mockProcess;

  beforeEach(() => {
    mockSnapshotCache = {
      store: jest.fn()
    };

    mockConfig = createMockConfig();

    // Mock spawn to return a mock process
    mockProcess = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.kill = jest.fn();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    spawn.mockReturnValue(mockProcess);

    streamManager = new StreamManager(mockSnapshotCache, mockConfig);
  });

  afterEach(() => {
    if (streamManager) {
      streamManager.stop();
    }
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(streamManager.snapshotCache).toBe(mockSnapshotCache);
      expect(streamManager.config).toBe(mockConfig);
      expect(streamManager.isRunning).toBe(false);
      expect(streamManager.retryCount).toBe(0);
      expect(streamManager.maxRetries).toBe(mockConfig.stream.maxRetries);
    });
  });

  describe('start', () => {
    it('should start FFmpeg process successfully', async () => {
      await streamManager.start();

      expect(streamManager.isRunning).toBe(true);
      expect(spawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining([
        '-rtsp_transport', 'tcp',
        '-timeout', '10000000',
        '-i', 'rtsp://test.example.com/stream'
      ]));
    });

    it('should not start if already running', async () => {
      streamManager.isRunning = true;
      
      await streamManager.start();
      
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should handle FFmpeg spawn errors', async () => {
      const error = new Error('FFmpeg not found');
      spawn.mockImplementation(() => {
        throw error;
      });

      await streamManager.start();

      expect(streamManager.isRunning).toBe(true); // Should still be true but with error handling
    });
  });

  describe('FFmpeg process handling', () => {
    beforeEach(async () => {
      await streamManager.start();
    });

    it('should process valid JPEG data from stdout', () => {
      const jpegStart = Buffer.from([0xFF, 0xD8]);
      const jpegEnd = Buffer.from([0xFF, 0xD9]);
      const jpegData = Buffer.concat([jpegStart, Buffer.from('image-data'), jpegEnd]);

      mockProcess.stdout.emit('data', jpegData);

      expect(mockSnapshotCache.store).toHaveBeenCalledWith({
        buffer: jpegData,
        timestamp: expect.any(String),
        size: jpegData.length,
        streamStatus: 'active'
      });
    });

    it('should handle incomplete JPEG data', () => {
      const incompleteData = Buffer.from([0xFF, 0xD8, 0x12, 0x34]); // No end marker

      mockProcess.stdout.emit('data', incompleteData);

      expect(mockSnapshotCache.store).not.toHaveBeenCalled();
    });

    it('should handle oversized images', () => {
      const jpegStart = Buffer.from([0xFF, 0xD8]);
      const jpegEnd = Buffer.from([0xFF, 0xD9]);
      const largeData = Buffer.alloc(10 * 1024 * 1024); // 10MB
      const oversizedJpeg = Buffer.concat([jpegStart, largeData, jpegEnd]);

      mockProcess.stdout.emit('data', oversizedJpeg);

      expect(mockSnapshotCache.store).not.toHaveBeenCalled();
    });

    it('should handle stderr data', () => {
      const errorSpy = jest.spyOn(streamManager, 'emit');
      
      mockProcess.stderr.emit('data', 'FFmpeg error: connection failed');

      expect(errorSpy).toHaveBeenCalledWith('streamError', expect.any(String));
    });

    it('should handle process close with error code', () => {
      const handleFailureSpy = jest.spyOn(streamManager, 'handleStreamFailure');
      
      mockProcess.emit('close', 1);

      expect(handleFailureSpy).toHaveBeenCalledWith('Process exited with code 1');
    });

    it('should handle process close with success code', () => {
      const handleFailureSpy = jest.spyOn(streamManager, 'handleStreamFailure');
      
      mockProcess.emit('close', 0);

      expect(handleFailureSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleStreamFailure', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      await streamManager.start();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on failure within retry limit', async () => {
      const spawnSpy = jest.spyOn(streamManager, 'spawnFFmpeg');
      
      await streamManager.handleStreamFailure('Test error');

      expect(streamManager.retryCount).toBe(1);
      
      jest.advanceTimersByTime(1000);
      
      expect(spawnSpy).toHaveBeenCalled();
    });

    it('should stop retrying after max retries', async () => {
      streamManager.retryCount = mockConfig.stream.maxRetries;
      const emitSpy = jest.spyOn(streamManager, 'emit');
      
      await streamManager.handleStreamFailure('Test error');

      expect(streamManager.isRunning).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith('streamFailed', 'Test error');
    });

    it('should use exponential backoff for retry delays', async () => {
      streamManager.retryCount = 3;
      const spawnSpy = jest.spyOn(streamManager, 'spawnFFmpeg');
      
      await streamManager.handleStreamFailure('Test error');

      // Should wait 4000ms (1000 * 2^(3-1))
      jest.advanceTimersByTime(3999);
      expect(spawnSpy).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      expect(spawnSpy).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await streamManager.start();
    });

    it('should stop the FFmpeg process', () => {
      streamManager.stop();

      expect(streamManager.isRunning).toBe(false);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should force kill after timeout', () => {
      jest.useFakeTimers();
      
      streamManager.stop();
      
      jest.advanceTimersByTime(5000);
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
      
      jest.useRealTimers();
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const status = streamManager.getStatus();

      expect(status).toEqual({
        isRunning: false,
        processId: null,
        retryCount: 0,
        lastFrameTime: null,
        frameCount: 0,
        uptime: 0,
        streamUrl: mockConfig.stream.rtspUrl
      });
    });

    it('should return status with process info when running', async () => {
      await streamManager.start();
      
      const status = streamManager.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.processId).toBe(12345);
      expect(status.uptime).toBeGreaterThan(0);
    });
  });

  describe('isHealthy', () => {
    it('should return false when not running', () => {
      expect(streamManager.isHealthy()).toBe(false);
    });

    it('should return false when no process', async () => {
      streamManager.isRunning = true;
      streamManager.ffmpegProcess = null;
      
      expect(streamManager.isHealthy()).toBe(false);
    });

    it('should return true when running and healthy', async () => {
      await streamManager.start();
      streamManager.lastFrameTime = Date.now();
      
      expect(streamManager.isHealthy()).toBe(true);
    });

    it('should return false when frames are stale', async () => {
      await streamManager.start();
      streamManager.lastFrameTime = Date.now() - (mockConfig.snapshot.interval * 4 * 1000);
      
      expect(streamManager.isHealthy()).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should emit frameReceived event', async () => {
      await streamManager.start();
      
      const eventSpy = jest.spyOn(streamManager, 'emit');
      const jpegData = Buffer.from([0xFF, 0xD8, 0x12, 0x34, 0xFF, 0xD9]);
      
      mockProcess.stdout.emit('data', jpegData);
      
      expect(eventSpy).toHaveBeenCalledWith('frameReceived', {
        size: jpegData.length,
        timestamp: expect.any(Number)
      });
    });

    it('should emit streamError event', async () => {
      await streamManager.start();
      
      const eventSpy = jest.spyOn(streamManager, 'emit');
      
      mockProcess.stderr.emit('data', 'error: connection failed');
      
      expect(eventSpy).toHaveBeenCalledWith('streamError', expect.stringContaining('error'));
    });
  });
});
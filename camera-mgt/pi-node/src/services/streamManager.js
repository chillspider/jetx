const { spawn } = require('child_process');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

class StreamManager extends EventEmitter {
  constructor(snapshotCache, config) {
    super();
    this.snapshotCache = snapshotCache;
    this.config = config;
    this.ffmpegProcess = null;
    this.isRunning = false;
    this.retryCount = 0;
    this.maxRetries = config.stream.maxRetries;
    this.lastFrameTime = null;
    this.restartCount = 0;
    this.frameCount = 0;
    this.startTime = null;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Stream already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    await this.spawnFFmpeg();
  }

  async spawnFFmpeg() {
    const args = [
      '-rtsp_transport', this.config.stream.rtspTransport,
      '-timeout', this.config.stream.timeout.toString(),
      '-i', this.config.stream.rtspUrl,
      '-vf', `fps=1/${this.config.snapshot.interval}`,
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-q:v', this.config.snapshot.quality.toString(),
      '-'
    ];

    logger.info('Starting FFmpeg with RTSP URL:', this.config.stream.rtspUrl);
    logger.debug('FFmpeg args:', args.join(' '));

    try {
      this.ffmpegProcess = spawn(this.config.ffmpeg.path, args);
      this.setupFFmpegHandlers();
      
      // Update metrics
      metrics.ffmpegProcessStatus.set(1);
      metrics.streamStatus.set(1);
      
      logger.info('FFmpeg process started with PID:', this.ffmpegProcess.pid);
    } catch (error) {
      logger.error('Failed to spawn FFmpeg:', error);
      metrics.ffmpegProcessStatus.set(0);
      metrics.streamStatus.set(0);
      this.handleStreamFailure(error.message);
    }
  }

  setupFFmpegHandlers() {
    let imageBuffer = Buffer.alloc(0);
    let lastLogTime = Date.now();

    this.ffmpegProcess.stdout.on('data', (chunk) => {
      imageBuffer = Buffer.concat([imageBuffer, chunk]);
      
      // Look for JPEG start and end markers
      const startMarker = imageBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
      const endMarker = imageBuffer.indexOf(Buffer.from([0xFF, 0xD9]));
      
      if (startMarker !== -1 && endMarker !== -1 && endMarker > startMarker) {
        const completeImage = imageBuffer.slice(startMarker, endMarker + 2);
        
        // Validate image size
        if (completeImage.length > this.config.snapshot.maxSize) {
          logger.warn(`Snapshot too large: ${completeImage.length} bytes`);
          imageBuffer = imageBuffer.slice(endMarker + 2);
          return;
        }
        
        // Store the snapshot
        this.snapshotCache.store({
          buffer: completeImage,
          timestamp: new Date().toISOString(),
          size: completeImage.length,
          streamStatus: 'active'
        });
        
        this.lastFrameTime = Date.now();
        this.frameCount++;
        this.retryCount = 0;
        
        // Update metrics
        metrics.lastSuccessfulSnapshot.set(Date.now() / 1000);
        this.updateSnapshotRate();
        
        this.emit('frameReceived', {
          size: completeImage.length,
          timestamp: this.lastFrameTime
        });
        
        // Clear processed data from buffer
        imageBuffer = imageBuffer.slice(endMarker + 2);
      }
      
      // Prevent buffer from growing too large
      if (imageBuffer.length > 10 * 1024 * 1024) {
        logger.warn('Image buffer too large, clearing');
        imageBuffer = Buffer.alloc(0);
      }
    });

    this.ffmpegProcess.stderr.on('data', (data) => {
      const message = data.toString();
      
      // Log errors less frequently to avoid spam
      const now = Date.now();
      if (now - lastLogTime > 5000) {
        if (message.includes('error') || message.includes('failed')) {
          logger.error('FFmpeg error:', message.substring(0, 200));
          this.emit('streamError', message);
        } else {
          logger.debug('FFmpeg:', message.substring(0, 200));
        }
        lastLogTime = now;
      }
    });

    this.ffmpegProcess.on('close', (code) => {
      logger.info(`FFmpeg process exited with code ${code}`);
      this.ffmpegProcess = null;
      
      // Update metrics
      metrics.ffmpegProcessStatus.set(0);
      metrics.streamStatus.set(0);
      
      if (this.isRunning && code !== 0) {
        this.handleStreamFailure(`Process exited with code ${code}`);
      }
    });

    this.ffmpegProcess.on('error', (error) => {
      logger.error('FFmpeg process error:', error);
      this.handleStreamFailure(error.message);
    });
  }

  async handleStreamFailure(error) {
    this.retryCount++;
    metrics.streamRestarts.inc();
    
    if (this.retryCount <= this.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 30000);
      
      logger.warn(`Stream failed, retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries}): ${error}`);
      
      setTimeout(() => {
        if (this.isRunning) {
          this.spawnFFmpeg();
        }
      }, delay);
    } else {
      logger.error(`Stream failed after ${this.maxRetries} attempts: ${error}`);
      this.isRunning = false;
      this.emit('streamFailed', error);
      
      // Store error snapshot
      this.snapshotCache.store({
        buffer: Buffer.from(''),
        timestamp: new Date().toISOString(),
        size: 0,
        streamStatus: 'error',
        error: error
      });
    }
  }

  updateSnapshotRate() {
    if (!this.startTime) return;
    
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    if (elapsedMinutes > 0) {
      const rate = this.frameCount / elapsedMinutes;
      metrics.snapshotGenerationRate.set(rate);
    }
  }

  stop() {
    logger.info('Stopping stream manager');
    this.isRunning = false;
    
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.ffmpegProcess) {
          logger.warn('Force killing FFmpeg process');
          this.ffmpegProcess.kill('SIGKILL');
        }
      }, 5000);
    }
    
    // Update metrics
    metrics.ffmpegProcessStatus.set(0);
    metrics.streamStatus.set(0);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processId: this.ffmpegProcess?.pid || null,
      retryCount: this.retryCount,
      lastFrameTime: this.lastFrameTime,
      frameCount: this.frameCount,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      streamUrl: this.config.stream.rtspUrl
    };
  }

  // Check if stream is healthy
  isHealthy() {
    if (!this.isRunning || !this.ffmpegProcess) {
      return false;
    }
    
    // Check if we've received a frame recently
    if (this.lastFrameTime) {
      const timeSinceLastFrame = Date.now() - this.lastFrameTime;
      const maxFrameAge = this.config.snapshot.interval * 3 * 1000; // 3x snapshot interval
      
      if (timeSinceLastFrame > maxFrameAge) {
        logger.warn(`No frames received for ${timeSinceLastFrame}ms`);
        return false;
      }
    }
    
    return true;
  }
}

module.exports = StreamManager;
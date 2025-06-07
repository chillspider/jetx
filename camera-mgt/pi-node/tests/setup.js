// Test setup and global configurations
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during testing

// Mock the winston logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

// Mock systeminformation to avoid actual system calls
jest.mock('systeminformation', () => ({
  currentLoad: jest.fn().mockResolvedValue({
    currentLoad: 45.2
  }),
  cpuTemperature: jest.fn().mockResolvedValue({
    main: 52.3
  }),
  mem: jest.fn().mockResolvedValue({
    used: 512000000,
    total: 1024000000
  }),
  fsSize: jest.fn().mockResolvedValue([{
    mount: '/',
    size: 10000000000,
    used: 5000000000,
    use: 50
  }]),
  networkStats: jest.fn().mockResolvedValue([{
    rx_bytes: 1000000,
    tx_bytes: 500000
  }]),
  time: jest.fn().mockResolvedValue({
    uptime: 86400
  })
}));

// Mock child_process for FFmpeg
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn()
  }
}));

// Mock chokidar file watcher
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

// Global test utilities
global.createMockSnapshot = () => ({
  buffer: Buffer.from('test-image-data'),
  timestamp: new Date().toISOString(),
  size: 1024,
  streamStatus: 'active',
  id: 'test-id-123',
  receivedAt: Date.now()
});

global.createMockConfig = () => ({
  stream: {
    rtspUrl: 'rtsp://test.example.com/stream',
    rtspTransport: 'tcp',
    timeout: 10000000,
    reconnectDelay: 5000,
    maxRetries: 5
  },
  snapshot: {
    interval: 10,
    quality: 3,
    cacheSize: 10,
    cacheTTL: 300,
    maxSize: 5242880
  },
  api: {
    key: 'test-api-key',
    rateLimit: {
      windowMs: 900000,
      max: 1000
    }
  },
  cloud: {
    apiUrl: 'http://test-cloud.example.com',
    syncInterval: 60000,
    webhookUrl: null,
    deviceId: 'test-device-001'
  },
  monitoring: {
    healthCheckInterval: 30000,
    systemMetricsInterval: 10000,
    temperature: { warning: 70, critical: 80 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 80, critical: 90 }
  },
  ffmpeg: {
    path: 'ffmpeg'
  }
});

// Setup and teardown helpers
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
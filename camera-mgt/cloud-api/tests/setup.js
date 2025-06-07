const { jest } = require('@jest/globals');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'carwash_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PLATE_RECOGNIZER_API_KEY = 'test-api-key';

// Mock external services
jest.mock('../src/services/plateRecognizerService', () => ({
  recognizePlateFromFile: jest.fn(),
  recognizePlateFromBuffer: jest.fn(),
  recognizePlateFromUrl: jest.fn(),
  getApiStatus: jest.fn(),
  validateImage: jest.fn()
}));

jest.mock('../src/services/webhookService', () => ({
  triggerWebhooks: jest.fn(),
  createWebhook: jest.fn(),
  getWebhooks: jest.fn(),
  getWebhookById: jest.fn(),
  updateWebhook: jest.fn(),
  deleteWebhook: jest.fn(),
  testWebhook: jest.fn()
}));

// Global test utilities
global.testUtils = {
  createMockRequest: (overrides = {}) => ({
    params: {},
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    url: '/',
    ip: '127.0.0.1',
    ...overrides
  }),
  
  createMockResponse: () => {
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      send: jest.fn(() => res),
      end: jest.fn(() => res),
      set: jest.fn(() => res),
      get: jest.fn(),
      statusCode: 200
    };
    return res;
  },

  createMockNext: () => jest.fn(),

  // Sample test data
  sampleDevice: {
    device_id: 'TEST-CAM-001',
    name: 'Test Camera',
    location: 'Test Location',
    site_code: 'TEST-001',
    ip_address: '192.168.1.100',
    port: 3000,
    rtsp_url: 'rtsp://192.168.1.100:554/stream1',
    capabilities: { resolution: '1920x1080' },
    configuration: { test: true },
    metadata: { test: true }
  },

  sampleWebhook: {
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    method: 'POST',
    event_type: 'plate_detected',
    headers: { 'Content-Type': 'application/json' },
    active: true
  },

  sampleTemplate: {
    name: 'Test Template',
    description: 'Test configuration template',
    device_type: 'test-device',
    template: { test: '{{value}}' },
    schema: {
      properties: {
        value: { type: 'string', default: 'test' }
      }
    }
  }
};

// Setup and teardown hooks
beforeAll(async () => {
  // Global setup
});

afterAll(async () => {
  // Global teardown
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
});
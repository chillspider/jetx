const deviceService = require('../../../src/services/deviceService');
const db = require('../../../src/config/database');

// Mock the database
jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    insert: jest.fn(),
    select: jest.fn(),
    where: jest.fn(),
    update: jest.fn(),
    del: jest.fn(),
    returning: jest.fn(),
    first: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    raw: jest.fn()
  }))
}));

describe('DeviceService', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      first: jest.fn(),
      count: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      raw: jest.fn()
    };
    db.mockImplementation(() => mockDb);
  });

  describe('registerDevice', () => {
    test('should register a new device successfully', async () => {
      const deviceData = global.testUtils.sampleDevice;
      const expectedDevice = { id: 'test-id', ...deviceData };
      
      mockDb.returning.mockResolvedValue([expectedDevice]);

      const result = await deviceService.registerDevice(deviceData);

      expect(db).toHaveBeenCalledWith('devices');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalledWith('*');
      expect(result).toEqual(expectedDevice);
    });

    test('should generate API key for new device', async () => {
      const deviceData = global.testUtils.sampleDevice;
      const expectedDevice = { id: 'test-id', api_key: 'generated-key' };
      
      mockDb.returning.mockResolvedValue([expectedDevice]);

      const result = await deviceService.registerDevice(deviceData);

      expect(result.api_key).toBeDefined();
      expect(result.api_key).toHaveLength(64); // 32 bytes = 64 hex chars
    });
  });

  describe('getDevices', () => {
    test('should get devices with default pagination', async () => {
      const mockDevices = [{ id: '1', name: 'Device 1' }];
      const mockCount = [{ total: '1' }];
      
      mockDb.orderBy.mockResolvedValue(mockDevices);
      mockDb.count.mockResolvedValue(mockCount);

      const result = await deviceService.getDevices();

      expect(result.devices).toEqual(mockDevices);
      expect(result.total).toBe(1);
    });

    test('should apply filters correctly', async () => {
      const filters = {
        status: 'online',
        site_code: 'TEST-001',
        search: 'camera',
        limit: 10,
        offset: 0
      };

      await deviceService.getDevices(filters);

      expect(mockDb.where).toHaveBeenCalledWith('status', 'online');
      expect(mockDb.where).toHaveBeenCalledWith('site_code', 'TEST-001');
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('getDeviceById', () => {
    test('should get device by ID', async () => {
      const deviceId = 'test-id';
      const expectedDevice = { id: deviceId, name: 'Test Device' };
      
      mockDb.first.mockResolvedValue(expectedDevice);

      const result = await deviceService.getDeviceById(deviceId);

      expect(mockDb.where).toHaveBeenCalledWith('id', deviceId);
      expect(mockDb.first).toHaveBeenCalled();
      expect(result).toEqual(expectedDevice);
    });

    test('should return null for non-existent device', async () => {
      mockDb.first.mockResolvedValue(null);

      const result = await deviceService.getDeviceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateDeviceStatus', () => {
    test('should update device status and last seen', async () => {
      const deviceId = 'test-device';
      const status = 'online';
      const metadata = { cpu_usage: 45 };
      const expectedDevice = { id: deviceId, status, last_seen: expect.any(Date) };
      
      mockDb.returning.mockResolvedValue([expectedDevice]);

      const result = await deviceService.updateDeviceStatus(deviceId, status, metadata);

      expect(mockDb.where).toHaveBeenCalledWith('device_id', deviceId);
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status,
          last_seen: expect.any(Date),
          updated_at: expect.any(Date)
        })
      );
      expect(result).toEqual(expectedDevice);
    });
  });

  describe('deleteDevice', () => {
    test('should delete device successfully', async () => {
      mockDb.del.mockResolvedValue(1);

      const result = await deviceService.deleteDevice('test-id');

      expect(mockDb.where).toHaveBeenCalledWith('id', 'test-id');
      expect(mockDb.del).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false if device not found', async () => {
      mockDb.del.mockResolvedValue(0);

      const result = await deviceService.deleteDevice('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getDeviceStats', () => {
    test('should return device statistics', async () => {
      const mockStatusStats = [
        { status: 'online', count: '3' },
        { status: 'offline', count: '2' }
      ];
      const mockTotalCount = [{ total: '5' }];
      const mockSiteStats = [
        { site_code: 'SITE-001', count: '3' },
        { site_code: 'SITE-002', count: '2' }
      ];

      // Mock the chain for different queries
      mockDb.select.mockImplementation((fields) => {
        if (fields === 'status') {
          return {
            count: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockResolvedValue(mockStatusStats)
          };
        }
        if (fields === 'site_code') {
          return {
            count: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue(mockSiteStats)
          };
        }
        return mockDb;
      });

      mockDb.count.mockResolvedValue(mockTotalCount);

      const result = await deviceService.getDeviceStats();

      expect(result.total).toBe(5);
      expect(result.by_status).toEqual({
        online: 3,
        offline: 2
      });
      expect(result.by_site).toHaveLength(2);
    });
  });

  describe('markOfflineDevices', () => {
    test('should mark devices offline based on threshold', async () => {
      const thresholdMinutes = 5;
      mockDb.update.mockResolvedValue(2);

      const result = await deviceService.markOfflineDevices(thresholdMinutes);

      expect(mockDb.where).toHaveBeenCalledWith('status', 'online');
      expect(mockDb.where).toHaveBeenCalledWith('last_seen', '<', expect.any(Date));
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'offline',
          updated_at: expect.any(Date)
        })
      );
      expect(result).toBe(2);
    });
  });

  describe('regenerateApiKey', () => {
    test('should generate new API key for device', async () => {
      const deviceId = 'test-id';
      const expectedDevice = { id: deviceId, api_key: 'new-api-key' };
      
      mockDb.returning.mockResolvedValue([expectedDevice]);

      const result = await deviceService.regenerateApiKey(deviceId);

      expect(mockDb.where).toHaveBeenCalledWith('id', deviceId);
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          api_key: expect.any(String),
          updated_at: expect.any(Date)
        })
      );
      expect(result).toEqual(expectedDevice);
    });
  });

  describe('bulkUpdateConfigurations', () => {
    test('should update configurations for multiple devices', async () => {
      const deviceIds = ['dev1', 'dev2', 'dev3'];
      const configuration = { test: 'config' };
      
      mockDb.update.mockResolvedValue(3);

      const result = await deviceService.bulkUpdateConfigurations(deviceIds, configuration);

      expect(mockDb.whereIn).toHaveBeenCalledWith('id', deviceIds);
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          configuration,
          updated_at: expect.any(Date)
        })
      );
      expect(result).toBe(3);
    });
  });
});

// Add mock for whereIn method
beforeEach(() => {
  if (mockDb) {
    mockDb.whereIn = jest.fn().mockReturnThis();
  }
});
const deviceController = require('../../../src/controllers/deviceController');
const deviceService = require('../../../src/services/deviceService');

// Mock the device service
jest.mock('../../../src/services/deviceService');

describe('DeviceController', () => {
  let req, res, next;

  beforeEach(() => {
    req = global.testUtils.createMockRequest();
    res = global.testUtils.createMockResponse();
    next = global.testUtils.createMockNext();
    jest.clearAllMocks();
  });

  describe('registerDevice', () => {
    test('should register device successfully', async () => {
      const deviceData = global.testUtils.sampleDevice;
      const createdDevice = { id: 'test-id', ...deviceData, api_key: 'test-key' };
      
      req.body = deviceData;
      deviceService.registerDevice.mockResolvedValue(createdDevice);

      await deviceController.registerDevice(req, res);

      expect(deviceService.registerDevice).toHaveBeenCalledWith(deviceData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device registered successfully',
        data: expect.objectContaining({
          id: 'test-id',
          api_key: 'test-key'
        })
      });
    });

    test('should handle duplicate device error', async () => {
      req.body = global.testUtils.sampleDevice;
      const error = new Error('Duplicate');
      error.code = '23505';
      deviceService.registerDevice.mockRejectedValue(error);

      await deviceController.registerDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Device with this ID already exists',
        error: 'DEVICE_ALREADY_EXISTS'
      });
    });

    test('should handle validation errors', async () => {
      // Mock validation result with errors
      const { validationResult } = require('express-validator');
      require('express-validator').validationResult = jest.fn(() => ({
        isEmpty: () => false,
        array: () => [{ field: 'device_id', msg: 'Required' }]
      }));

      await deviceController.registerDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'device_id', msg: 'Required' }]
      });
    });
  });

  describe('getDevices', () => {
    test('should get devices with pagination', async () => {
      const mockResult = {
        devices: [{ id: '1', name: 'Device 1' }],
        total: 1,
        limit: 50,
        offset: 0
      };
      
      req.query = { limit: '50', offset: '0' };
      deviceService.getDevices.mockResolvedValue(mockResult);

      await deviceController.getDevices(req, res);

      expect(deviceService.getDevices).toHaveBeenCalledWith({
        status: undefined,
        site_code: undefined,
        search: undefined,
        limit: 50,
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.devices,
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          has_more: false
        }
      });
    });

    test('should apply filters from query parameters', async () => {
      req.query = {
        status: 'online',
        site_code: 'TEST-001',
        search: 'camera',
        limit: '10',
        offset: '20'
      };

      const mockResult = { devices: [], total: 0, limit: 10, offset: 20 };
      deviceService.getDevices.mockResolvedValue(mockResult);

      await deviceController.getDevices(req, res);

      expect(deviceService.getDevices).toHaveBeenCalledWith({
        status: 'online',
        site_code: 'TEST-001',
        search: 'camera',
        limit: 10,
        offset: 20,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
    });
  });

  describe('getDevice', () => {
    test('should get device by ID', async () => {
      const deviceId = 'test-id';
      const mockDevice = { id: deviceId, name: 'Test Device' };
      
      req.params = { id: deviceId };
      deviceService.getDeviceById.mockResolvedValue(mockDevice);

      await deviceController.getDevice(req, res);

      expect(deviceService.getDeviceById).toHaveBeenCalledWith(deviceId);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDevice
      });
    });

    test('should return 404 for non-existent device', async () => {
      req.params = { id: 'non-existent' };
      deviceService.getDeviceById.mockResolvedValue(null);

      await deviceController.getDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Device not found',
        error: 'DEVICE_NOT_FOUND'
      });
    });
  });

  describe('updateDevice', () => {
    test('should update device successfully', async () => {
      const deviceId = 'test-id';
      const updateData = { name: 'Updated Device' };
      const updatedDevice = { id: deviceId, ...updateData };
      
      req.params = { id: deviceId };
      req.body = updateData;
      deviceService.updateDevice.mockResolvedValue(updatedDevice);

      await deviceController.updateDevice(req, res);

      expect(deviceService.updateDevice).toHaveBeenCalledWith(deviceId, updateData);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device updated successfully',
        data: updatedDevice
      });
    });

    test('should return 404 if device not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { name: 'Updated' };
      deviceService.updateDevice.mockResolvedValue(null);

      await deviceController.updateDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Device not found',
        error: 'DEVICE_NOT_FOUND'
      });
    });
  });

  describe('deleteDevice', () => {
    test('should delete device successfully', async () => {
      req.params = { id: 'test-id' };
      deviceService.deleteDevice.mockResolvedValue(true);

      await deviceController.deleteDevice(req, res);

      expect(deviceService.deleteDevice).toHaveBeenCalledWith('test-id');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device deleted successfully'
      });
    });

    test('should return 404 if device not found', async () => {
      req.params = { id: 'non-existent' };
      deviceService.deleteDevice.mockResolvedValue(false);

      await deviceController.deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Device not found',
        error: 'DEVICE_NOT_FOUND'
      });
    });
  });

  describe('updateDeviceStatus', () => {
    test('should update device status successfully', async () => {
      const deviceId = 'test-device';
      const statusData = { status: 'online', metadata: { cpu: 50 } };
      const updatedDevice = { device_id: deviceId, status: 'online' };
      
      req.params = { device_id: deviceId };
      req.body = statusData;
      deviceService.updateDeviceStatus.mockResolvedValue(updatedDevice);

      await deviceController.updateDeviceStatus(req, res);

      expect(deviceService.updateDeviceStatus).toHaveBeenCalledWith(
        deviceId, 
        'online', 
        { cpu: 50 }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device status updated successfully',
        data: expect.objectContaining({
          device_id: deviceId,
          status: 'online'
        })
      });
    });
  });

  describe('getDeviceStats', () => {
    test('should return device statistics', async () => {
      const mockStats = {
        total: 10,
        by_status: { online: 7, offline: 3 },
        by_site: [{ site_code: 'SITE-001', count: 5 }]
      };
      
      deviceService.getDeviceStats.mockResolvedValue(mockStats);

      await deviceController.getDeviceStats(req, res);

      expect(deviceService.getDeviceStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('regenerateApiKey', () => {
    test('should regenerate API key successfully', async () => {
      const deviceId = 'test-id';
      const updatedDevice = { id: deviceId, api_key: 'new-key' };
      
      req.params = { id: deviceId };
      deviceService.regenerateApiKey.mockResolvedValue(updatedDevice);

      await deviceController.regenerateApiKey(req, res);

      expect(deviceService.regenerateApiKey).toHaveBeenCalledWith(deviceId);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'API key regenerated successfully',
        data: expect.objectContaining({
          id: deviceId,
          api_key: 'new-key'
        })
      });
    });
  });

  describe('bulkOperations', () => {
    test('should perform bulk configuration update', async () => {
      const bulkData = {
        operation: 'update_configuration',
        device_ids: ['dev1', 'dev2'],
        data: { configuration: { test: true } }
      };
      
      req.body = bulkData;
      deviceService.bulkUpdateConfigurations.mockResolvedValue(2);

      await deviceController.bulkOperations(req, res);

      expect(deviceService.bulkUpdateConfigurations).toHaveBeenCalledWith(
        ['dev1', 'dev2'],
        { test: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk update_configuration completed successfully',
        data: { affected_devices: 2 }
      });
    });

    test('should return error for invalid operation', async () => {
      req.body = {
        operation: 'invalid_operation',
        device_ids: ['dev1'],
        data: {}
      };

      await deviceController.bulkOperations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid bulk operation',
        error: 'INVALID_OPERATION'
      });
    });
  });

  describe('error handling', () => {
    test('should handle service errors gracefully', async () => {
      req.params = { id: 'test-id' };
      deviceService.getDeviceById.mockRejectedValue(new Error('Database error'));

      await deviceController.getDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch device',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });
});

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => []
  }))
}));
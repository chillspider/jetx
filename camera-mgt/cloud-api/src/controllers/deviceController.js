const deviceService = require('../services/deviceService');
const { validationResult } = require('express-validator');

class DeviceController {
  /**
   * Register a new device
   */
  async registerDevice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const device = await deviceService.registerDevice(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: {
          id: device.id,
          device_id: device.device_id,
          name: device.name,
          api_key: device.api_key,
          status: device.status,
          created_at: device.created_at
        }
      });
    } catch (error) {
      console.error('Error registering device:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Device with this ID already exists',
          error: 'DEVICE_ALREADY_EXISTS'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register device',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get all devices with filtering and pagination
   */
  async getDevices(req, res) {
    try {
      const filters = {
        status: req.query.status,
        site_code: req.query.site_code,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await deviceService.getDevices(filters);

      res.json({
        success: true,
        data: result.devices,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          has_more: result.offset + result.limit < result.total
        }
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch devices',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get device by ID
   */
  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await deviceService.getDeviceById(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch device',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Update device information
   */
  async updateDevice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const device = await deviceService.updateDevice(id, req.body);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: device
      });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update device',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      const deleted = await deviceService.deleteDevice(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete device',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Update device status (heartbeat endpoint)
   */
  async updateDeviceStatus(req, res) {
    try {
      const { device_id } = req.params;
      const { status, metadata = {} } = req.body;

      const device = await deviceService.updateDeviceStatus(device_id, status, metadata);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Device status updated successfully',
        data: {
          device_id: device.device_id,
          status: device.status,
          last_seen: device.last_seen
        }
      });
    } catch (error) {
      console.error('Error updating device status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update device status',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Update device configuration
   */
  async updateDeviceConfiguration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { configuration } = req.body;

      const device = await deviceService.updateDeviceConfiguration(id, configuration);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Device configuration updated successfully',
        data: {
          id: device.id,
          device_id: device.device_id,
          configuration: device.configuration,
          updated_at: device.updated_at
        }
      });
    } catch (error) {
      console.error('Error updating device configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update device configuration',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get devices by site
   */
  async getDevicesBySite(req, res) {
    try {
      const { site_code } = req.params;
      const devices = await deviceService.getDevicesBySite(site_code);

      res.json({
        success: true,
        data: devices,
        count: devices.length
      });
    } catch (error) {
      console.error('Error fetching devices by site:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch devices by site',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(req, res) {
    try {
      const stats = await deviceService.getDeviceStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching device stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch device statistics',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Regenerate API key for device
   */
  async regenerateApiKey(req, res) {
    try {
      const { id } = req.params;
      const device = await deviceService.regenerateApiKey(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'API key regenerated successfully',
        data: {
          id: device.id,
          device_id: device.device_id,
          api_key: device.api_key,
          updated_at: device.updated_at
        }
      });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate API key',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Bulk operations on devices
   */
  async bulkOperations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { operation, device_ids, data } = req.body;

      let result;

      switch (operation) {
        case 'update_configuration':
          result = await deviceService.bulkUpdateConfigurations(device_ids, data.configuration);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid bulk operation',
            error: 'INVALID_OPERATION'
          });
      }

      res.json({
        success: true,
        message: `Bulk ${operation} completed successfully`,
        data: {
          affected_devices: result
        }
      });
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new DeviceController();
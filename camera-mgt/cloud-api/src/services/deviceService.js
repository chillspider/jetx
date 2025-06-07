const db = require('../config/database');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class DeviceService {
  constructor() {
    this.tableName = 'devices';
  }

  /**
   * Register a new device in the fleet
   */
  async registerDevice(deviceData) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    const device = {
      id: uuidv4(),
      device_id: deviceData.device_id,
      name: deviceData.name,
      location: deviceData.location,
      site_code: deviceData.site_code,
      ip_address: deviceData.ip_address,
      port: deviceData.port || 3000,
      rtsp_url: deviceData.rtsp_url,
      api_key: apiKey,
      status: 'offline',
      capabilities: deviceData.capabilities || {},
      configuration: deviceData.configuration || {},
      metadata: deviceData.metadata || {},
      firmware_version: deviceData.firmware_version,
      model: deviceData.model,
      serial_number: deviceData.serial_number,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [insertedDevice] = await db(this.tableName)
      .insert(device)
      .returning('*');

    return insertedDevice;
  }

  /**
   * Get all devices with optional filtering
   */
  async getDevices(filters = {}) {
    let query = db(this.tableName).select('*');

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.site_code) {
      query = query.where('site_code', filters.site_code);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
          .orWhere('location', 'ilike', `%${filters.search}%`)
          .orWhere('device_id', 'ilike', `%${filters.search}%`);
      });
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    const devices = await query;
    
    // Get total count for pagination
    let countQuery = db(this.tableName).count('id as total');
    
    if (filters.status) {
      countQuery = countQuery.where('status', filters.status);
    }
    
    if (filters.site_code) {
      countQuery = countQuery.where('site_code', filters.site_code);
    }

    if (filters.search) {
      countQuery = countQuery.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
          .orWhere('location', 'ilike', `%${filters.search}%`)
          .orWhere('device_id', 'ilike', `%${filters.search}%`);
      });
    }

    const [{ total }] = await countQuery;

    return {
      devices,
      total: parseInt(total),
      limit: filters.limit,
      offset: filters.offset
    };
  }

  /**
   * Get device by ID
   */
  async getDeviceById(id) {
    const device = await db(this.tableName)
      .where('id', id)
      .first();

    return device;
  }

  /**
   * Get device by device_id
   */
  async getDeviceByDeviceId(deviceId) {
    const device = await db(this.tableName)
      .where('device_id', deviceId)
      .first();

    return device;
  }

  /**
   * Get device by API key
   */
  async getDeviceByApiKey(apiKey) {
    const device = await db(this.tableName)
      .where('api_key', apiKey)
      .first();

    return device;
  }

  /**
   * Update device information
   */
  async updateDevice(id, updateData) {
    const updated = {
      ...updateData,
      updated_at: new Date()
    };

    const [updatedDevice] = await db(this.tableName)
      .where('id', id)
      .update(updated)
      .returning('*');

    return updatedDevice;
  }

  /**
   * Update device status and last seen timestamp
   */
  async updateDeviceStatus(deviceId, status, metadata = {}) {
    const updated = {
      status,
      last_seen: new Date(),
      updated_at: new Date()
    };

    if (Object.keys(metadata).length > 0) {
      updated.metadata = db.raw('metadata || ?', [JSON.stringify(metadata)]);
    }

    const [updatedDevice] = await db(this.tableName)
      .where('device_id', deviceId)
      .update(updated)
      .returning('*');

    return updatedDevice;
  }

  /**
   * Update device configuration
   */
  async updateDeviceConfiguration(id, configuration) {
    const [updatedDevice] = await db(this.tableName)
      .where('id', id)
      .update({
        configuration,
        updated_at: new Date()
      })
      .returning('*');

    return updatedDevice;
  }

  /**
   * Delete device
   */
  async deleteDevice(id) {
    const deletedRows = await db(this.tableName)
      .where('id', id)
      .del();

    return deletedRows > 0;
  }

  /**
   * Get devices by site code
   */
  async getDevicesBySite(siteCode) {
    const devices = await db(this.tableName)
      .where('site_code', siteCode)
      .orderBy('name');

    return devices;
  }

  /**
   * Get offline devices (haven't been seen for a while)
   */
  async getOfflineDevices(thresholdMinutes = 5) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    
    const devices = await db(this.tableName)
      .where('status', 'online')
      .where('last_seen', '<', threshold);

    return devices;
  }

  /**
   * Mark offline devices based on last seen timestamp
   */
  async markOfflineDevices(thresholdMinutes = 5) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    
    const updatedCount = await db(this.tableName)
      .where('status', 'online')
      .where('last_seen', '<', threshold)
      .update({
        status: 'offline',
        updated_at: new Date()
      });

    return updatedCount;
  }

  /**
   * Get device statistics
   */
  async getDeviceStats() {
    const stats = await db(this.tableName)
      .select('status')
      .count('* as count')
      .groupBy('status');

    const totalDevices = await db(this.tableName).count('id as total');

    const siteStats = await db(this.tableName)
      .select('site_code')
      .count('* as count')
      .groupBy('site_code')
      .orderBy('count', 'desc');

    return {
      total: parseInt(totalDevices[0].total),
      by_status: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {}),
      by_site: siteStats.map(site => ({
        site_code: site.site_code,
        count: parseInt(site.count)
      }))
    };
  }

  /**
   * Bulk update device configurations
   */
  async bulkUpdateConfigurations(deviceIds, configuration) {
    const updated = await db(this.tableName)
      .whereIn('id', deviceIds)
      .update({
        configuration,
        updated_at: new Date()
      });

    return updated;
  }

  /**
   * Generate new API key for device
   */
  async regenerateApiKey(id) {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    const [updatedDevice] = await db(this.tableName)
      .where('id', id)
      .update({
        api_key: newApiKey,
        updated_at: new Date()
      })
      .returning('*');

    return updatedDevice;
  }
}

module.exports = new DeviceService();
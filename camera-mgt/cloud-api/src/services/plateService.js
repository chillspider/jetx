const db = require('../config/database');
const plateRecognizerService = require('./plateRecognizerService');
const webhookService = require('./webhookService');
const { v4: uuidv4 } = require('uuid');

class PlateService {
  constructor() {
    this.tableName = 'plate_recognitions';
  }

  /**
   * Process image for plate recognition
   */
  async processImage(deviceId, imagePath, options = {}) {
    try {
      // Validate image
      const validation = plateRecognizerService.validateImage(imagePath);
      if (!validation.valid) {
        throw new Error(`Invalid image: ${validation.error}`);
      }

      // Get device info for context
      const device = await db('devices').where('id', deviceId).first();
      if (!device) {
        throw new Error('Device not found');
      }

      // Prepare recognition options
      const recognitionOptions = {
        camera_id: device.device_id,
        timestamp: new Date().toISOString(),
        regions: options.regions,
        mmc: options.mmc
      };

      // Perform plate recognition
      const recognitionResult = await plateRecognizerService.recognizePlateFromFile(
        imagePath, 
        recognitionOptions
      );

      if (!recognitionResult.success || !recognitionResult.best_result) {
        // Save failed recognition attempt
        await this.saveRecognitionResult(deviceId, null, recognitionResult, imagePath);
        return {
          success: false,
          message: 'No plates detected',
          processing_time_ms: recognitionResult.processing_time_ms
        };
      }

      // Save successful recognition
      const savedResult = await this.saveRecognitionResult(
        deviceId, 
        recognitionResult.best_result, 
        recognitionResult, 
        imagePath,
        options.thumbnail_path
      );

      // Trigger webhooks asynchronously
      setImmediate(() => {
        this.triggerWebhooks(savedResult, device);
      });

      return {
        success: true,
        data: savedResult,
        processing_time_ms: recognitionResult.processing_time_ms
      };

    } catch (error) {
      console.error('Error processing image for plate recognition:', error);
      throw error;
    }
  }

  /**
   * Process image from buffer
   */
  async processImageBuffer(deviceId, imageBuffer, filename, options = {}) {
    try {
      // Get device info for context
      const device = await db('devices').where('id', deviceId).first();
      if (!device) {
        throw new Error('Device not found');
      }

      // Prepare recognition options
      const recognitionOptions = {
        camera_id: device.device_id,
        timestamp: new Date().toISOString(),
        regions: options.regions,
        mmc: options.mmc
      };

      // Perform plate recognition
      const recognitionResult = await plateRecognizerService.recognizePlateFromBuffer(
        imageBuffer,
        filename,
        recognitionOptions
      );

      if (!recognitionResult.success || !recognitionResult.best_result) {
        return {
          success: false,
          message: 'No plates detected',
          processing_time_ms: recognitionResult.processing_time_ms
        };
      }

      // Save successful recognition
      const savedResult = await this.saveRecognitionResult(
        deviceId, 
        recognitionResult.best_result, 
        recognitionResult, 
        options.image_path,
        options.thumbnail_path
      );

      // Trigger webhooks asynchronously
      setImmediate(() => {
        this.triggerWebhooks(savedResult, device);
      });

      return {
        success: true,
        data: savedResult,
        processing_time_ms: recognitionResult.processing_time_ms
      };

    } catch (error) {
      console.error('Error processing image buffer for plate recognition:', error);
      throw error;
    }
  }

  /**
   * Save recognition result to database
   */
  async saveRecognitionResult(deviceId, bestResult, fullResult, imagePath = null, thumbnailPath = null) {
    const plateRecognition = {
      id: uuidv4(),
      device_id: deviceId,
      plate_number: bestResult?.plate_number || null,
      confidence: bestResult?.confidence || 0,
      region: bestResult?.region || null,
      vehicle_type: bestResult?.vehicle_type || null,
      bounding_box: bestResult?.bounding_box || null,
      candidates: fullResult.all_results || [],
      image_path: imagePath,
      thumbnail_path: thumbnailPath,
      platerecognizer_response: fullResult.raw_response || {},
      processing_time_ms: fullResult.processing_time_ms?.toString() || null,
      webhook_status: 'pending',
      recognized_at: new Date(),
      created_at: new Date()
    };

    const [savedResult] = await db(this.tableName)
      .insert(plateRecognition)
      .returning('*');

    return savedResult;
  }

  /**
   * Get plate recognitions with filtering
   */
  async getRecognitions(filters = {}) {
    let query = db(this.tableName)
      .select(
        'plate_recognitions.*',
        'devices.device_id',
        'devices.name as device_name',
        'devices.location',
        'devices.site_code'
      )
      .leftJoin('devices', 'plate_recognitions.device_id', 'devices.id');

    // Apply filters
    if (filters.device_id) {
      query = query.where('plate_recognitions.device_id', filters.device_id);
    }

    if (filters.plate_number) {
      query = query.where('plate_recognitions.plate_number', 'ilike', `%${filters.plate_number}%`);
    }

    if (filters.site_code) {
      query = query.where('devices.site_code', filters.site_code);
    }

    if (filters.min_confidence) {
      query = query.where('plate_recognitions.confidence', '>=', filters.min_confidence);
    }

    if (filters.start_date) {
      query = query.where('plate_recognitions.recognized_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('plate_recognitions.recognized_at', '<=', filters.end_date);
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    // Sorting
    const sortBy = filters.sort_by || 'recognized_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.orderBy(`plate_recognitions.${sortBy}`, sortOrder);

    const recognitions = await query;

    // Get total count for pagination
    let countQuery = db(this.tableName)
      .leftJoin('devices', 'plate_recognitions.device_id', 'devices.id')
      .count('plate_recognitions.id as total');

    if (filters.device_id) {
      countQuery = countQuery.where('plate_recognitions.device_id', filters.device_id);
    }

    if (filters.plate_number) {
      countQuery = countQuery.where('plate_recognitions.plate_number', 'ilike', `%${filters.plate_number}%`);
    }

    if (filters.site_code) {
      countQuery = countQuery.where('devices.site_code', filters.site_code);
    }

    if (filters.min_confidence) {
      countQuery = countQuery.where('plate_recognitions.confidence', '>=', filters.min_confidence);
    }

    if (filters.start_date) {
      countQuery = countQuery.where('plate_recognitions.recognized_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      countQuery = countQuery.where('plate_recognitions.recognized_at', '<=', filters.end_date);
    }

    const [{ total }] = await countQuery;

    return {
      recognitions,
      total: parseInt(total),
      limit: filters.limit,
      offset: filters.offset
    };
  }

  /**
   * Get recognition by ID
   */
  async getRecognitionById(id) {
    const recognition = await db(this.tableName)
      .select(
        'plate_recognitions.*',
        'devices.device_id',
        'devices.name as device_name',
        'devices.location',
        'devices.site_code'
      )
      .leftJoin('devices', 'plate_recognitions.device_id', 'devices.id')
      .where('plate_recognitions.id', id)
      .first();

    return recognition;
  }

  /**
   * Get recognition statistics
   */
  async getRecognitionStats(filters = {}) {
    let baseQuery = db(this.tableName)
      .leftJoin('devices', 'plate_recognitions.device_id', 'devices.id');

    // Apply date filters
    if (filters.start_date) {
      baseQuery = baseQuery.where('plate_recognitions.recognized_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      baseQuery = baseQuery.where('plate_recognitions.recognized_at', '<=', filters.end_date);
    }

    if (filters.site_code) {
      baseQuery = baseQuery.where('devices.site_code', filters.site_code);
    }

    // Total recognitions
    const [{ total }] = await baseQuery.clone().count('plate_recognitions.id as total');

    // Recognitions by confidence ranges
    const confidenceRanges = await baseQuery.clone()
      .select(
        db.raw(`
          CASE 
            WHEN confidence >= 0.9 THEN 'high'
            WHEN confidence >= 0.7 THEN 'medium'
            ELSE 'low'
          END as confidence_range
        `),
        db.raw('COUNT(*) as count')
      )
      .groupBy('confidence_range');

    // Top plates
    const topPlates = await baseQuery.clone()
      .select('plate_number')
      .count('* as count')
      .whereNotNull('plate_number')
      .groupBy('plate_number')
      .orderBy('count', 'desc')
      .limit(10);

    // Recognitions by device
    const byDevice = await baseQuery.clone()
      .select('devices.device_id', 'devices.name', 'devices.location')
      .count('plate_recognitions.id as count')
      .groupBy('devices.device_id', 'devices.name', 'devices.location')
      .orderBy('count', 'desc');

    // Hourly distribution
    const hourlyStats = await baseQuery.clone()
      .select(db.raw('EXTRACT(HOUR FROM recognized_at) as hour'))
      .count('* as count')
      .groupBy('hour')
      .orderBy('hour');

    return {
      total: parseInt(total),
      confidence_distribution: confidenceRanges.reduce((acc, range) => {
        acc[range.confidence_range] = parseInt(range.count);
        return acc;
      }, {}),
      top_plates: topPlates.map(plate => ({
        plate_number: plate.plate_number,
        count: parseInt(plate.count)
      })),
      by_device: byDevice.map(device => ({
        device_id: device.device_id,
        name: device.name,
        location: device.location,
        count: parseInt(device.count)
      })),
      hourly_distribution: hourlyStats.map(stat => ({
        hour: parseInt(stat.hour),
        count: parseInt(stat.count)
      }))
    };
  }

  /**
   * Trigger webhooks for plate recognition
   */
  async triggerWebhooks(plateRecognition, device) {
    try {
      await webhookService.triggerWebhooks('plate_detected', {
        plate_recognition: plateRecognition,
        device: device
      });

      // Update webhook status
      await db(this.tableName)
        .where('id', plateRecognition.id)
        .update({
          webhook_status: 'sent',
          webhook_sent_at: new Date()
        });

    } catch (error) {
      console.error('Error triggering webhooks:', error);
      
      // Update webhook status to failed
      await db(this.tableName)
        .where('id', plateRecognition.id)
        .update({
          webhook_status: 'failed',
          webhook_sent_at: new Date()
        });
    }
  }

  /**
   * Delete old recognitions (cleanup)
   */
  async deleteOldRecognitions(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const deletedCount = await db(this.tableName)
      .where('created_at', '<', cutoffDate)
      .del();

    return deletedCount;
  }
}

module.exports = new PlateService();
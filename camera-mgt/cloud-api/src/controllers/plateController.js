const plateService = require('../services/plateService');
const deviceService = require('../services/deviceService');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/default');

class PlateController {
  /**
   * Get all plate recognitions with filtering
   */
  async getRecognitions(req, res) {
    try {
      const filters = {
        device_id: req.query.device_id,
        plate_number: req.query.plate_number,
        site_code: req.query.site_code,
        min_confidence: parseFloat(req.query.min_confidence),
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        sort_by: req.query.sort_by || 'recognized_at',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await plateService.getRecognitions(filters);

      res.json({
        success: true,
        data: result.recognitions,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          has_more: result.offset + result.limit < result.total
        }
      });
    } catch (error) {
      console.error('Error fetching plate recognitions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plate recognitions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get plate recognition by ID
   */
  async getRecognition(req, res) {
    try {
      const { id } = req.params;
      const recognition = await plateService.getRecognitionById(id);

      if (!recognition) {
        return res.status(404).json({
          success: false,
          message: 'Plate recognition not found',
          error: 'RECOGNITION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: recognition
      });
    } catch (error) {
      console.error('Error fetching plate recognition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plate recognition',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Process uploaded image for plate recognition
   */
  async recognizePlateFromFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
          error: 'NO_FILE_PROVIDED'
        });
      }

      // Get device ID (from auth or body)
      let deviceId = req.body.device_id;
      
      if (!deviceId && req.auth && req.auth.type === 'device' && req.device) {
        deviceId = req.device.id;
      }

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required',
          error: 'DEVICE_ID_REQUIRED'
        });
      }

      // Verify device exists
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      // Save uploaded file temporarily
      const tempDir = path.join(config.upload.directory, 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
      const tempPath = path.join(tempDir, filename);
      
      await fs.writeFile(tempPath, req.file.buffer);

      try {
        // Process image for plate recognition
        const options = {
          regions: req.body.regions?.split(','),
          mmc: req.body.mmc === 'true'
        };

        const result = await plateService.processImage(deviceId, tempPath, options);

        // Clean up temporary file
        await fs.unlink(tempPath).catch(err => 
          console.warn('Failed to delete temp file:', err)
        );

        if (result.success) {
          res.json({
            success: true,
            message: 'Plate recognition completed successfully',
            data: result.data,
            processing_time_ms: result.processing_time_ms
          });
        } else {
          res.json({
            success: false,
            message: result.message,
            processing_time_ms: result.processing_time_ms
          });
        }

      } catch (processingError) {
        // Clean up temporary file on error
        await fs.unlink(tempPath).catch(err => 
          console.warn('Failed to delete temp file:', err)
        );
        throw processingError;
      }

    } catch (error) {
      console.error('Error processing image for plate recognition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process image for plate recognition',
        error: 'PROCESSING_ERROR'
      });
    }
  }

  /**
   * Process image from URL for plate recognition
   */
  async recognizePlateFromUrl(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { device_id, image_url, regions, mmc } = req.body;

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required',
          error: 'DEVICE_ID_REQUIRED'
        });
      }

      if (!image_url) {
        return res.status(400).json({
          success: false,
          message: 'Image URL is required',
          error: 'IMAGE_URL_REQUIRED'
        });
      }

      // Verify device exists
      const device = await deviceService.getDeviceById(device_id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: 'DEVICE_NOT_FOUND'
        });
      }

      // Process image from URL (would need additional implementation)
      res.status(501).json({
        success: false,
        message: 'URL-based plate recognition not yet implemented',
        error: 'NOT_IMPLEMENTED'
      });

    } catch (error) {
      console.error('Error processing image URL for plate recognition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process image URL for plate recognition',
        error: 'PROCESSING_ERROR'
      });
    }
  }

  /**
   * Get plate recognition statistics
   */
  async getRecognitionStats(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        site_code: req.query.site_code
      };

      const stats = await plateService.getRecognitionStats(filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching plate recognition statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plate recognition statistics',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Reprocess failed recognitions
   */
  async reprocessFailedRecognitions(req, res) {
    try {
      // This would be an admin-only endpoint to reprocess failed recognitions
      res.status(501).json({
        success: false,
        message: 'Reprocessing not yet implemented',
        error: 'NOT_IMPLEMENTED'
      });
    } catch (error) {
      console.error('Error reprocessing failed recognitions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reprocess failed recognitions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Clean up old recognitions
   */
  async cleanupOldRecognitions(req, res) {
    try {
      const daysToKeep = parseInt(req.query.days) || 30;
      
      const deletedCount = await plateService.deleteOldRecognitions(daysToKeep);

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} old plate recognitions`,
        data: {
          deleted_count: deletedCount,
          days_kept: daysToKeep
        }
      });
    } catch (error) {
      console.error('Error cleaning up old recognitions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean up old recognitions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new PlateController();
const { body, param, query, validationResult } = require('express-validator');

class ValidationMiddleware {
  /**
   * Handle validation errors
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }

  /**
   * Device registration validation
   */
  validateDeviceRegistration() {
    return [
      body('device_id')
        .notEmpty()
        .withMessage('Device ID is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Device ID must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Device ID can only contain letters, numbers, underscores, and hyphens'),

      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

      body('location')
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Location must be between 1 and 255 characters'),

      body('site_code')
        .notEmpty()
        .withMessage('Site code is required')
        .isLength({ min: 1, max: 20 })
        .withMessage('Site code must be between 1 and 20 characters'),

      body('ip_address')
        .notEmpty()
        .withMessage('IP address is required')
        .isIP()
        .withMessage('Invalid IP address format'),

      body('port')
        .optional()
        .isInt({ min: 1, max: 65535 })
        .withMessage('Port must be between 1 and 65535'),

      body('rtsp_url')
        .notEmpty()
        .withMessage('RTSP URL is required')
        .isURL({ protocols: ['rtsp'] })
        .withMessage('Invalid RTSP URL format'),

      body('capabilities')
        .optional()
        .isObject()
        .withMessage('Capabilities must be an object'),

      body('configuration')
        .optional()
        .isObject()
        .withMessage('Configuration must be an object'),

      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),

      body('firmware_version')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Firmware version must be max 20 characters'),

      body('model')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Model must be max 50 characters'),

      body('serial_number')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Serial number must be max 100 characters'),

      this.handleValidationErrors
    ];
  }

  /**
   * Device update validation
   */
  validateDeviceUpdate() {
    return [
      body('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

      body('location')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Location must be between 1 and 255 characters'),

      body('site_code')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Site code must be between 1 and 20 characters'),

      body('ip_address')
        .optional()
        .isIP()
        .withMessage('Invalid IP address format'),

      body('port')
        .optional()
        .isInt({ min: 1, max: 65535 })
        .withMessage('Port must be between 1 and 65535'),

      body('rtsp_url')
        .optional()
        .isURL({ protocols: ['rtsp'] })
        .withMessage('Invalid RTSP URL format'),

      body('status')
        .optional()
        .isIn(['online', 'offline', 'error', 'maintenance'])
        .withMessage('Invalid status value'),

      this.handleValidationErrors
    ];
  }

  /**
   * Device status update validation
   */
  validateDeviceStatus() {
    return [
      body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['online', 'offline', 'error', 'maintenance'])
        .withMessage('Invalid status value'),

      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),

      this.handleValidationErrors
    ];
  }

  /**
   * Configuration update validation
   */
  validateConfigurationUpdate() {
    return [
      body('configuration')
        .notEmpty()
        .withMessage('Configuration is required')
        .isObject()
        .withMessage('Configuration must be an object'),

      this.handleValidationErrors
    ];
  }

  /**
   * Webhook creation validation
   */
  validateWebhookCreation() {
    return [
      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

      body('url')
        .notEmpty()
        .withMessage('URL is required')
        .isURL({ protocols: ['http', 'https'] })
        .withMessage('Invalid URL format'),

      body('method')
        .optional()
        .isIn(['GET', 'POST', 'PUT', 'PATCH'])
        .withMessage('Invalid HTTP method'),

      body('event_type')
        .notEmpty()
        .withMessage('Event type is required')
        .isIn(['plate_detected', 'device_status_changed', 'device_error'])
        .withMessage('Invalid event type'),

      body('headers')
        .optional()
        .isObject()
        .withMessage('Headers must be an object'),

      body('timeout_ms')
        .optional()
        .isInt({ min: 1000, max: 60000 })
        .withMessage('Timeout must be between 1000 and 60000 milliseconds'),

      body('retry_attempts')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Retry attempts must be between 0 and 10'),

      body('filter_conditions')
        .optional()
        .isObject()
        .withMessage('Filter conditions must be an object'),

      this.handleValidationErrors
    ];
  }

  /**
   * Template creation validation
   */
  validateTemplateCreation() {
    return [
      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

      body('device_type')
        .notEmpty()
        .withMessage('Device type is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Device type must be between 1 and 50 characters'),

      body('template')
        .notEmpty()
        .withMessage('Template is required')
        .isObject()
        .withMessage('Template must be an object'),

      body('schema')
        .notEmpty()
        .withMessage('Schema is required')
        .isObject()
        .withMessage('Schema must be an object'),

      body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be max 500 characters'),

      body('version')
        .optional()
        .matches(/^\d+\.\d+\.\d+$/)
        .withMessage('Version must be in semver format (x.y.z)'),

      this.handleValidationErrors
    ];
  }

  /**
   * Template application validation
   */
  validateTemplateApplication() {
    return [
      body('device_ids')
        .notEmpty()
        .withMessage('Device IDs are required')
        .isArray({ min: 1 })
        .withMessage('At least one device ID is required'),

      body('device_ids.*')
        .isUUID()
        .withMessage('Each device ID must be a valid UUID'),

      body('variables')
        .optional()
        .isObject()
        .withMessage('Variables must be an object'),

      this.handleValidationErrors
    ];
  }

  /**
   * Bulk operations validation
   */
  validateBulkOperation() {
    return [
      body('operation')
        .notEmpty()
        .withMessage('Operation is required')
        .isIn(['update_configuration', 'update_status'])
        .withMessage('Invalid operation type'),

      body('device_ids')
        .notEmpty()
        .withMessage('Device IDs are required')
        .isArray({ min: 1, max: 100 })
        .withMessage('Between 1 and 100 device IDs allowed'),

      body('device_ids.*')
        .isUUID()
        .withMessage('Each device ID must be a valid UUID'),

      body('data')
        .notEmpty()
        .withMessage('Data is required')
        .isObject()
        .withMessage('Data must be an object'),

      this.handleValidationErrors
    ];
  }

  /**
   * UUID parameter validation
   */
  validateUuidParam(paramName = 'id') {
    return [
      param(paramName)
        .isUUID()
        .withMessage(`${paramName} must be a valid UUID`),

      this.handleValidationErrors
    ];
  }

  /**
   * Pagination validation
   */
  validatePagination() {
    return [
      query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Limit must be between 1 and 1000'),

      query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be 0 or greater'),

      query('sort_by')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Sort by field must be between 1 and 50 characters'),

      query('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),

      this.handleValidationErrors
    ];
  }

  /**
   * Date range validation
   */
  validateDateRange() {
    return [
      query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),

      query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format')
        .custom((value, { req }) => {
          if (req.query.start_date && value && new Date(value) <= new Date(req.query.start_date)) {
            throw new Error('End date must be after start date');
          }
          return true;
        }),

      this.handleValidationErrors
    ];
  }

  /**
   * File upload validation
   */
  validateFileUpload() {
    return [
      body('device_id')
        .optional()
        .isUUID()
        .withMessage('Device ID must be a valid UUID'),

      this.handleValidationErrors
    ];
  }
}

module.exports = new ValidationMiddleware();
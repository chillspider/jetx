const express = require('express');
const router = express.Router();

const deviceController = require('../controllers/deviceController');
const validationMiddleware = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Device registration (admin only)
router.post('/', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateDeviceRegistration(),
  asyncHandler(deviceController.registerDevice)
);

// Get all devices with filtering and pagination
router.get('/', 
  validationMiddleware.validatePagination(),
  asyncHandler(deviceController.getDevices)
);

// Get device statistics
router.get('/stats', 
  asyncHandler(deviceController.getDeviceStats)
);

// Get devices by site
router.get('/site/:site_code', 
  asyncHandler(deviceController.getDevicesBySite)
);

// Get device by ID
router.get('/:id', 
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(deviceController.getDevice)
);

// Update device (admin only)
router.put('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  validationMiddleware.validateDeviceUpdate(),
  asyncHandler(deviceController.updateDevice)
);

// Delete device (admin only)
router.delete('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(deviceController.deleteDevice)
);

// Update device status (device can update its own status)
router.post('/:device_id/status', 
  authMiddleware.validateDeviceOwnership,
  validationMiddleware.validateDeviceStatus(),
  asyncHandler(deviceController.updateDeviceStatus)
);

// Update device configuration (admin only)
router.put('/:id/configuration', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  validationMiddleware.validateConfigurationUpdate(),
  asyncHandler(deviceController.updateDeviceConfiguration)
);

// Regenerate API key (admin only)
router.post('/:id/regenerate-key', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(deviceController.regenerateApiKey)
);

// Bulk operations (admin only)
router.post('/bulk', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateBulkOperation(),
  asyncHandler(deviceController.bulkOperations)
);

module.exports = router;
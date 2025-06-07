const express = require('express');
const router = express.Router();

const webhookController = require('../controllers/webhookController');
const validationMiddleware = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all webhooks (admin only)
router.get('/', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validatePagination(),
  asyncHandler(webhookController.getWebhooks)
);

// Create new webhook (admin only)
router.post('/', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateWebhookCreation(),
  asyncHandler(webhookController.createWebhook)
);

// Get webhook statistics (admin only)
router.get('/stats', 
  authMiddleware.requireUserAuth,
  asyncHandler(webhookController.getWebhookStats)
);

// Get webhook delivery history (admin only)
router.get('/deliveries', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validatePagination(),
  validationMiddleware.validateDateRange(),
  asyncHandler(webhookController.getDeliveryHistory)
);

// Get webhook by ID (admin only)
router.get('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(webhookController.getWebhook)
);

// Update webhook (admin only)
router.put('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(webhookController.updateWebhook)
);

// Delete webhook (admin only)
router.delete('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(webhookController.deleteWebhook)
);

// Test webhook delivery (admin only)
router.post('/:id/test', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(webhookController.testWebhook)
);

module.exports = router;
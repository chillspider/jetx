const express = require('express');
const router = express.Router();

const templateController = require('../controllers/templateController');
const validationMiddleware = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all templates (admin only)
router.get('/', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validatePagination(),
  asyncHandler(templateController.getTemplates)
);

// Create new template (admin only)
router.post('/', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateTemplateCreation(),
  asyncHandler(templateController.createTemplate)
);

// Get template usage statistics (admin only)
router.get('/usage', 
  authMiddleware.requireUserAuth,
  asyncHandler(templateController.getTemplateUsage)
);

// Get default template for device type
router.get('/default/:device_type', 
  asyncHandler(templateController.getDefaultTemplate)
);

// Get template by ID
router.get('/:id', 
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(templateController.getTemplate)
);

// Update template (admin only)
router.put('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(templateController.updateTemplate)
);

// Delete template (admin only)
router.delete('/:id', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(templateController.deleteTemplate)
);

// Generate configuration from template
router.post('/:id/generate', 
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(templateController.generateConfiguration)
);

// Apply template to devices (admin only)
router.post('/:id/apply', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  validationMiddleware.validateTemplateApplication(),
  asyncHandler(templateController.applyTemplate)
);

// Clone template (admin only)
router.post('/:id/clone', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(templateController.cloneTemplate)
);

// Validate template (admin only)
router.post('/:id/validate', 
  authMiddleware.requireUserAuth,
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(templateController.validateTemplate)
);

module.exports = router;
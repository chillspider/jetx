const express = require('express');
const { authenticateApiKey, optionalAuth, localNetworkOnly, validateDeviceId } = require('../middleware/auth');
const { createConfigLimiter } = require('../middleware/rateLimit');
const ConfigController = require('../controllers/configController');

module.exports = (services, config) => {
  const router = express.Router();
  const configController = new ConfigController(services);
  const configLimiter = createConfigLimiter();
  const authMiddleware = authenticateApiKey(config);
  const optionalAuthMiddleware = optionalAuth(config);
  const localOnly = localNetworkOnly();
  const deviceValidation = validateDeviceId();

  // Apply rate limiting to all config routes
  router.use(configLimiter);

  // Apply authentication to all routes
  router.use(authMiddleware);

  // Apply device validation to all routes
  router.use(deviceValidation);

  // Get current configuration (sanitized)
  router.get('/', configController.getConfig);

  // Update configuration
  router.put('/', localOnly, configController.updateConfig);

  // Reload configuration from file and cloud
  router.post('/reload', localOnly, configController.reloadConfig);

  // Get configuration status
  router.get('/status', configController.getStatus);

  // Sync with cloud configuration
  router.post('/sync', configController.syncConfig);

  // Validate configuration without applying
  router.post('/validate', configController.validateConfig);

  // Get configuration schema/template
  router.get('/schema', optionalAuthMiddleware, configController.getSchema);

  return router;
};
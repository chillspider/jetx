const express = require('express');
const { authenticateApiKey, optionalAuth } = require('../middleware/auth');
const { createSnapshotLimiter } = require('../middleware/rateLimit');
const SnapshotController = require('../controllers/snapshotController');

module.exports = (services, config) => {
  const router = express.Router();
  const snapshotController = new SnapshotController(services);
  const snapshotLimiter = createSnapshotLimiter();
  const authMiddleware = authenticateApiKey(config);
  const optionalAuthMiddleware = optionalAuth(config);

  // Apply rate limiting to all snapshot routes
  router.use(snapshotLimiter);

  // Get latest snapshot (main endpoint)
  router.get('/', authMiddleware, snapshotController.getLatest);

  // Get snapshot metadata/info
  router.get('/info', authMiddleware, snapshotController.getInfo);

  // Get snapshot statistics
  router.get('/stats', authMiddleware, snapshotController.getStats);

  // Get snapshot by ID (for debugging/historical access)
  router.get('/list', authMiddleware, snapshotController.getList);

  // Get snapshot by specific ID
  router.get('/:id', optionalAuthMiddleware, snapshotController.getById);

  // Admin operations - clear cache
  router.delete('/cache', authMiddleware, snapshotController.clearCache);

  return router;
};
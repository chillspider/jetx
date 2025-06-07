const express = require('express');
const { authenticateApiKey, optionalAuth, localNetworkOnly } = require('../middleware/auth');
const { createHealthLimiter } = require('../middleware/rateLimit');
const HealthController = require('../controllers/healthController');

module.exports = (services, config) => {
  const router = express.Router();
  const healthController = new HealthController(services);
  const healthLimiter = createHealthLimiter();
  const authMiddleware = authenticateApiKey(config);
  const optionalAuthMiddleware = optionalAuth(config);
  const localOnly = localNetworkOnly();

  // Apply rate limiting to health routes (except liveness/readiness)
  router.use((req, res, next) => {
    // Skip rate limiting for Kubernetes health checks
    if (req.path === '/liveness' || req.path === '/readiness') {
      return next();
    }
    healthLimiter(req, res, next);
  });

  // Basic health check (public endpoint with optional auth)
  router.get('/', optionalAuthMiddleware, healthController.getHealth);

  // Detailed statistics (authenticated)
  router.get('/stats', authMiddleware, healthController.getStats);

  // Component health details (authenticated)
  router.get('/components', authMiddleware, healthController.getComponents);

  // Kubernetes-style health checks (no auth, no rate limit)
  router.get('/liveness', healthController.getLiveness);
  router.get('/readiness', healthController.getReadiness);

  // Version information (public)
  router.get('/version', healthController.getVersion);

  // Admin operations (authenticated, local network only)
  router.post('/self-heal', authMiddleware, localOnly, healthController.triggerSelfHealing);
  router.post('/restart-stream', authMiddleware, localOnly, healthController.restartStream);

  return router;
};
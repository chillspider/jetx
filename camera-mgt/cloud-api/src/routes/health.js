const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');
const { asyncHandler } = require('../middleware/errorHandler');

// Basic health check (no auth required)
router.get('/', asyncHandler(healthController.basicHealthCheck));

// Detailed health check (no auth required)
router.get('/detailed', asyncHandler(healthController.detailedHealthCheck));

// Database health check
router.get('/database', asyncHandler(healthController.databaseHealthCheck));

// External services health check
router.get('/services', asyncHandler(healthController.servicesHealthCheck));

// Application metrics
router.get('/metrics', asyncHandler(healthController.getMetrics));

// Readiness probe (for Kubernetes)
router.get('/ready', asyncHandler(healthController.readinessProbe));

// Liveness probe (for Kubernetes)
router.get('/live', asyncHandler(healthController.livenessProbe));

module.exports = router;
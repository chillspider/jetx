const express = require('express');
const { register } = require('../utils/metrics');
const { localNetworkOnly } = require('../middleware/auth');

// Import route modules
const snapshotRoutes = require('./snapshots');
const healthRoutes = require('./health');
const configRoutes = require('./config');

module.exports = (services, config) => {
  const router = express.Router();

  // Health check endpoint (root level for load balancers)
  router.get('/', (req, res) => {
    res.json({
      service: 'carwash-pi-node',
      status: 'operational',
      version: require('../../package.json').version,
      timestamp: new Date().toISOString(),
      device_id: config.cloud.deviceId
    });
  });

  // Mount API routes
  router.use('/api/snapshot', snapshotRoutes(services, config));
  router.use('/api/health', healthRoutes(services, config));
  router.use('/api/config', configRoutes(services, config));

  // Prometheus metrics endpoint (local network only, no auth, no rate limit)
  router.get('/metrics', localNetworkOnly(), async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Metrics collection failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API documentation endpoint
  router.get('/api', (req, res) => {
    res.json({
      service: 'CarWash Pi Node API',
      version: require('../../package.json').version,
      documentation: {
        endpoints: {
          snapshots: {
            'GET /api/snapshot': 'Get latest snapshot image',
            'GET /api/snapshot/info': 'Get snapshot metadata',
            'GET /api/snapshot/stats': 'Get cache statistics',
            'GET /api/snapshot/list': 'List available snapshots',
            'GET /api/snapshot/:id': 'Get specific snapshot by ID',
            'DELETE /api/snapshot/cache': 'Clear snapshot cache (admin)'
          },
          health: {
            'GET /api/health': 'Basic health check',
            'GET /api/health/stats': 'Detailed system statistics',
            'GET /api/health/components': 'Component health status',
            'GET /api/health/liveness': 'Kubernetes liveness probe',
            'GET /api/health/readiness': 'Kubernetes readiness probe',
            'GET /api/health/version': 'Version information',
            'POST /api/health/self-heal': 'Trigger self-healing (admin)',
            'POST /api/health/restart-stream': 'Restart stream (admin)'
          },
          configuration: {
            'GET /api/config': 'Get current configuration',
            'PUT /api/config': 'Update configuration (admin)',
            'POST /api/config/reload': 'Reload configuration (admin)',
            'GET /api/config/status': 'Configuration sync status',
            'POST /api/config/sync': 'Sync with cloud',
            'POST /api/config/validate': 'Validate configuration',
            'GET /api/config/schema': 'Get configuration schema'
          },
          metrics: {
            'GET /metrics': 'Prometheus metrics (local network only)'
          }
        },
        authentication: {
          header: 'X-API-Key',
          authorization: 'Bearer <token>',
          query: 'api_key=<token>'
        },
        rate_limits: {
          snapshots: '60 requests per minute',
          health: '120 requests per minute',
          config: '10 requests per 15 minutes',
          general: '1000 requests per 15 minutes'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  return router;
};
const db = require('../config/database');
const plateRecognizerService = require('../services/plateRecognizerService');
const config = require('../config/default');
const os = require('os');

class HealthController {
  /**
   * Basic health check
   */
  async basicHealthCheck(req, res) {
    try {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'CarWash Cloud API',
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Detailed health check
   */
  async detailedHealthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'CarWash Cloud API',
        version: '1.0.0',
        environment: config.server.env,
        uptime: process.uptime(),
        system: {
          platform: os.platform(),
          arch: os.arch(),
          node_version: process.version,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
          },
          load_average: os.loadavg(),
          cpu_count: os.cpus().length
        },
        checks: {}
      };

      // Database check
      try {
        await db.raw('SELECT 1');
        health.checks.database = {
          status: 'healthy',
          message: 'Database connection successful'
        };
      } catch (dbError) {
        health.checks.database = {
          status: 'unhealthy',
          message: 'Database connection failed',
          error: dbError.message
        };
        health.status = 'degraded';
      }

      // PlateRecognizer API check
      try {
        const apiStatus = await plateRecognizerService.getApiStatus();
        health.checks.plate_recognizer = {
          status: apiStatus.success ? 'healthy' : 'unhealthy',
          message: apiStatus.success ? 'PlateRecognizer API accessible' : 'PlateRecognizer API unavailable',
          data: apiStatus.data
        };
      } catch (prError) {
        health.checks.plate_recognizer = {
          status: 'unhealthy',
          message: 'PlateRecognizer API check failed',
          error: prError.message
        };
        health.status = 'degraded';
      }

      // Check if any critical services are down
      const criticalChecks = ['database'];
      const unhealthyCritical = criticalChecks.some(check => 
        health.checks[check] && health.checks[check].status === 'unhealthy'
      );

      if (unhealthyCritical) {
        health.status = 'unhealthy';
        return res.status(503).json(health);
      }

      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Database health check
   */
  async databaseHealthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      // Test basic connection
      await db.raw('SELECT 1');
      
      // Test write capability
      await db.raw('SELECT COUNT(*) FROM devices');
      
      const responseTime = Date.now() - startTime;

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connection: 'active',
          response_time_ms: responseTime,
          client: db.client.config.client
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connection: 'failed',
          error: error.message
        }
      });
    }
  }

  /**
   * External services health check
   */
  async servicesHealthCheck(req, res) {
    try {
      const services = {};

      // PlateRecognizer API
      try {
        const apiStatus = await plateRecognizerService.getApiStatus();
        services.plate_recognizer = {
          status: apiStatus.success ? 'healthy' : 'unhealthy',
          response_time_ms: apiStatus.response_time || null,
          quota: apiStatus.data || null
        };
      } catch (error) {
        services.plate_recognizer = {
          status: 'unhealthy',
          error: error.message
        };
      }

      const allHealthy = Object.values(services).every(service => 
        service.status === 'healthy'
      );

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Get application metrics
   */
  async getMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: {
          load_average: os.loadavg(),
          cpu_count: os.cpus().length
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          node_version: process.version,
          free_memory: os.freemem(),
          total_memory: os.totalmem()
        }
      };

      // Database metrics
      try {
        const deviceCount = await db('devices').count('id as total');
        const plateCount = await db('plate_recognitions').count('id as total');
        const webhookCount = await db('webhooks').count('id as total');

        metrics.database = {
          devices: parseInt(deviceCount[0].total),
          plate_recognitions: parseInt(plateCount[0].total),
          webhooks: parseInt(webhookCount[0].total)
        };
      } catch (dbError) {
        metrics.database = {
          error: 'Unable to fetch database metrics'
        };
      }

      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch metrics',
        message: error.message
      });
    }
  }

  /**
   * Kubernetes readiness probe
   */
  async readinessProbe(req, res) {
    try {
      // Check if the service is ready to accept traffic
      await db.raw('SELECT 1');
      
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Kubernetes liveness probe
   */
  async livenessProbe(req, res) {
    try {
      // Check if the service is alive
      const uptime = process.uptime();
      
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: uptime
      });
    } catch (error) {
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Get service info
   */
  async getServiceInfo(req, res) {
    try {
      const info = {
        name: 'CarWash Cloud API',
        version: '1.0.0',
        description: 'Phase 2 Cloud API for managing 500+ Raspberry Pi devices',
        environment: config.server.env,
        build: {
          timestamp: new Date().toISOString(),
          node_version: process.version,
          platform: os.platform()
        },
        endpoints: {
          health: '/api/health',
          devices: '/api/devices',
          plates: '/api/plates',
          webhooks: '/api/webhooks',
          templates: '/api/templates'
        }
      };

      res.json(info);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch service info',
        message: error.message
      });
    }
  }
}

module.exports = new HealthController();
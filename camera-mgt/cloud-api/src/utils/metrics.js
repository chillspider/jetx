const promClient = require('prom-client');
const config = require('../config/default');

class MetricsCollector {
  constructor() {
    if (!config.metrics.enabled) {
      return;
    }

    // Create registry
    this.register = new promClient.Registry();
    
    // Add default metrics
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'carwash_cloud_api_'
    });

    this.initializeCustomMetrics();
  }

  initializeCustomMetrics() {
    // HTTP Request metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'carwash_cloud_api_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'carwash_cloud_api_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Database metrics
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'carwash_cloud_api_database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
    });

    this.databaseQueryTotal = new promClient.Counter({
      name: 'carwash_cloud_api_database_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status']
    });

    // Device metrics
    this.devicesTotal = new promClient.Gauge({
      name: 'carwash_cloud_api_devices_total',
      help: 'Total number of registered devices',
      labelNames: ['status', 'site_code']
    });

    this.deviceStatusChanges = new promClient.Counter({
      name: 'carwash_cloud_api_device_status_changes_total',
      help: 'Total number of device status changes',
      labelNames: ['from_status', 'to_status', 'site_code']
    });

    // Plate recognition metrics
    this.plateRecognitionsTotal = new promClient.Counter({
      name: 'carwash_cloud_api_plate_recognitions_total',
      help: 'Total number of plate recognitions',
      labelNames: ['device_id', 'site_code', 'success']
    });

    this.plateRecognitionDuration = new promClient.Histogram({
      name: 'carwash_cloud_api_plate_recognition_duration_seconds',
      help: 'Duration of plate recognition processing in seconds',
      labelNames: ['device_id', 'success'],
      buckets: [0.5, 1, 2, 5, 10, 30]
    });

    this.plateRecognitionConfidence = new promClient.Histogram({
      name: 'carwash_cloud_api_plate_recognition_confidence',
      help: 'Confidence score of plate recognitions',
      labelNames: ['device_id'],
      buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0]
    });

    // Webhook metrics
    this.webhookDeliveries = new promClient.Counter({
      name: 'carwash_cloud_api_webhook_deliveries_total',
      help: 'Total number of webhook deliveries',
      labelNames: ['webhook_id', 'event_type', 'status']
    });

    this.webhookDeliveryDuration = new promClient.Histogram({
      name: 'carwash_cloud_api_webhook_delivery_duration_seconds',
      help: 'Duration of webhook deliveries in seconds',
      labelNames: ['webhook_id', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    this.webhookRetries = new promClient.Counter({
      name: 'carwash_cloud_api_webhook_retries_total',
      help: 'Total number of webhook retries',
      labelNames: ['webhook_id', 'attempt']
    });

    // External API metrics
    this.externalApiCalls = new promClient.Counter({
      name: 'carwash_cloud_api_external_api_calls_total',
      help: 'Total number of external API calls',
      labelNames: ['service', 'method', 'status_code']
    });

    this.externalApiDuration = new promClient.Histogram({
      name: 'carwash_cloud_api_external_api_duration_seconds',
      help: 'Duration of external API calls in seconds',
      labelNames: ['service', 'method'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Configuration template metrics
    this.templateApplications = new promClient.Counter({
      name: 'carwash_cloud_api_template_applications_total',
      help: 'Total number of template applications',
      labelNames: ['template_id', 'device_type', 'success']
    });

    // Error metrics
    this.errorsTotal = new promClient.Counter({
      name: 'carwash_cloud_api_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'service', 'severity']
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.databaseQueryDuration);
    this.register.registerMetric(this.databaseQueryTotal);
    this.register.registerMetric(this.devicesTotal);
    this.register.registerMetric(this.deviceStatusChanges);
    this.register.registerMetric(this.plateRecognitionsTotal);
    this.register.registerMetric(this.plateRecognitionDuration);
    this.register.registerMetric(this.plateRecognitionConfidence);
    this.register.registerMetric(this.webhookDeliveries);
    this.register.registerMetric(this.webhookDeliveryDuration);
    this.register.registerMetric(this.webhookRetries);
    this.register.registerMetric(this.externalApiCalls);
    this.register.registerMetric(this.externalApiDuration);
    this.register.registerMetric(this.templateApplications);
    this.register.registerMetric(this.errorsTotal);
  }

  // HTTP request tracking
  recordHttpRequest(method, route, statusCode, duration) {
    if (!config.metrics.enabled) return;

    const labels = { method, route, status_code: statusCode };
    this.httpRequestDuration.observe(labels, duration / 1000);
    this.httpRequestTotal.inc(labels);
  }

  // Database query tracking
  recordDatabaseQuery(operation, table, duration, success = true) {
    if (!config.metrics.enabled) return;

    const labels = { operation, table };
    this.databaseQueryDuration.observe(labels, duration / 1000);
    this.databaseQueryTotal.inc({ ...labels, status: success ? 'success' : 'error' });
  }

  // Device metrics
  updateDeviceCount(status, siteCode, count) {
    if (!config.metrics.enabled) return;
    this.devicesTotal.set({ status, site_code: siteCode }, count);
  }

  recordDeviceStatusChange(fromStatus, toStatus, siteCode) {
    if (!config.metrics.enabled) return;
    this.deviceStatusChanges.inc({ from_status: fromStatus, to_status: toStatus, site_code: siteCode });
  }

  // Plate recognition metrics
  recordPlateRecognition(deviceId, siteCode, success, duration, confidence = null) {
    if (!config.metrics.enabled) return;

    this.plateRecognitionsTotal.inc({ 
      device_id: deviceId, 
      site_code: siteCode, 
      success: success ? 'true' : 'false' 
    });

    if (duration) {
      this.plateRecognitionDuration.observe({ 
        device_id: deviceId, 
        success: success ? 'true' : 'false' 
      }, duration / 1000);
    }

    if (confidence !== null) {
      this.plateRecognitionConfidence.observe({ device_id: deviceId }, confidence);
    }
  }

  // Webhook metrics
  recordWebhookDelivery(webhookId, eventType, status, duration) {
    if (!config.metrics.enabled) return;

    this.webhookDeliveries.inc({ webhook_id: webhookId, event_type: eventType, status });
    
    if (duration) {
      this.webhookDeliveryDuration.observe({ webhook_id: webhookId, status }, duration / 1000);
    }
  }

  recordWebhookRetry(webhookId, attempt) {
    if (!config.metrics.enabled) return;
    this.webhookRetries.inc({ webhook_id: webhookId, attempt: attempt.toString() });
  }

  // External API metrics
  recordExternalApiCall(service, method, statusCode, duration) {
    if (!config.metrics.enabled) return;

    this.externalApiCalls.inc({ service, method, status_code: statusCode });
    this.externalApiDuration.observe({ service, method }, duration / 1000);
  }

  // Template metrics
  recordTemplateApplication(templateId, deviceType, success) {
    if (!config.metrics.enabled) return;
    this.templateApplications.inc({ 
      template_id: templateId, 
      device_type: deviceType, 
      success: success ? 'true' : 'false' 
    });
  }

  // Error tracking
  recordError(type, service, severity = 'error') {
    if (!config.metrics.enabled) return;
    this.errorsTotal.inc({ type, service, severity });
  }

  // Get metrics for export
  getMetrics() {
    if (!config.metrics.enabled) {
      return 'Metrics disabled';
    }
    return this.register.metrics();
  }

  // Get metrics content type
  getContentType() {
    return this.register.contentType;
  }

  // Express middleware for automatic HTTP metrics collection
  middleware() {
    if (!config.metrics.enabled) {
      return (req, res, next) => next();
    }

    return (req, res, next) => {
      const startTime = Date.now();

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = Date.now() - startTime;
        const route = req.route ? req.route.path : req.path;
        
        this.recordHttpRequest(req.method, route, res.statusCode, duration);
        
        return originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Database query middleware
  createDatabaseMiddleware() {
    if (!config.metrics.enabled) {
      return null;
    }

    return {
      recordQuery: (operation, table, startTime, success = true) => {
        const duration = Date.now() - startTime;
        this.recordDatabaseQuery(operation, table, duration, success);
      }
    };
  }

  // Helper to create timing functions
  createTimer(metricType) {
    const startTime = Date.now();
    
    return {
      end: (labels = {}) => {
        const duration = Date.now() - startTime;
        
        switch (metricType) {
          case 'http':
            this.recordHttpRequest(labels.method, labels.route, labels.statusCode, duration);
            break;
          case 'database':
            this.recordDatabaseQuery(labels.operation, labels.table, duration, labels.success);
            break;
          case 'external_api':
            this.recordExternalApiCall(labels.service, labels.method, labels.statusCode, duration);
            break;
          case 'webhook':
            this.recordWebhookDelivery(labels.webhookId, labels.eventType, labels.status, duration);
            break;
        }
        
        return duration;
      }
    };
  }
}

// Create singleton instance
const metrics = new MetricsCollector();

module.exports = metrics;
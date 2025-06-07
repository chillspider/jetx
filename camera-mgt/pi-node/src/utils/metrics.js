const client = require('prom-client');
const config = require('../config/default');

// Create a Registry
const register = new client.Registry();

// Add default labels
register.setDefaultLabels({
  app: 'carwash-pi-node',
  device_id: config.cloud.deviceId
});

// Collect default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const metrics = {
  // Stream metrics
  streamStatus: new client.Gauge({
    name: 'carwash_stream_status',
    help: 'Stream connection status (1=connected, 0=disconnected)',
    registers: [register]
  }),

  ffmpegProcessStatus: new client.Gauge({
    name: 'carwash_ffmpeg_process_status',
    help: 'FFmpeg process status (1=running, 0=stopped)',
    registers: [register]
  }),

  streamRestarts: new client.Counter({
    name: 'carwash_stream_restarts_total',
    help: 'Total number of stream restarts',
    registers: [register]
  }),

  // Snapshot metrics
  snapshotGenerationRate: new client.Gauge({
    name: 'carwash_snapshot_generation_rate',
    help: 'Snapshots generated per minute',
    registers: [register]
  }),

  snapshotCacheSize: new client.Gauge({
    name: 'carwash_snapshot_cache_size_bytes',
    help: 'Current snapshot cache size in bytes',
    registers: [register]
  }),

  lastSuccessfulSnapshot: new client.Gauge({
    name: 'carwash_last_successful_snapshot_timestamp',
    help: 'Timestamp of last successful snapshot',
    registers: [register]
  }),

  // API metrics
  apiRequestDuration: new client.Histogram({
    name: 'carwash_api_request_duration_seconds',
    help: 'API request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register]
  }),

  apiRequestTotal: new client.Counter({
    name: 'carwash_api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  }),

  // System metrics
  systemTemperature: new client.Gauge({
    name: 'carwash_system_temperature_celsius',
    help: 'System temperature in Celsius',
    registers: [register]
  }),

  // Configuration metrics
  configReloads: new client.Counter({
    name: 'carwash_config_reloads_total',
    help: 'Total number of configuration reloads',
    registers: [register]
  }),

  configSyncErrors: new client.Counter({
    name: 'carwash_config_sync_errors_total',
    help: 'Total number of configuration sync errors',
    registers: [register]
  })
};

// Helper function to record API metrics
metrics.recordApiCall = (method, route, statusCode, duration) => {
  metrics.apiRequestDuration.observe(
    { method, route, status_code: statusCode },
    duration
  );
  metrics.apiRequestTotal.inc({ method, route, status_code: statusCode });
};

// Export metrics and register
module.exports = {
  metrics,
  register
};
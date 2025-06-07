const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('configuration_templates').del();

  // Sample configuration templates for different device types
  const templates = [
    {
      id: uuidv4(),
      name: 'Standard Raspberry Pi Camera',
      description: 'Default configuration for Raspberry Pi 4 with HD camera module',
      version: '1.0.0',
      template: {
        stream: {
          rtspTransport: '{{rtsp_transport}}',
          timeout: '{{stream_timeout}}',
          rtspUrl: '{{rtsp_url}}'
        },
        snapshot: {
          interval: '{{snapshot_interval}}',
          quality: '{{snapshot_quality}}',
          maxCache: '{{max_cache_size}}'
        },
        plateRecognizer: {
          enabled: '{{plate_recognition_enabled}}',
          regions: '{{recognition_regions}}',
          minConfidence: '{{min_confidence}}'
        },
        monitoring: {
          healthCheckInterval: '{{health_check_interval}}',
          metricsEnabled: '{{metrics_enabled}}',
          logLevel: '{{log_level}}'
        }
      },
      schema: {
        type: 'object',
        properties: {
          rtsp_transport: {
            type: 'string',
            enum: ['tcp', 'udp'],
            default: 'tcp'
          },
          stream_timeout: {
            type: 'integer',
            minimum: 5000,
            maximum: 60000,
            default: 30000
          },
          rtsp_url: {
            type: 'string',
            pattern: '^rtsp://.+$'
          },
          snapshot_interval: {
            type: 'integer',
            minimum: 1,
            maximum: 60,
            default: 5
          },
          snapshot_quality: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            default: 2
          },
          max_cache_size: {
            type: 'integer',
            minimum: 10,
            maximum: 1000,
            default: 100
          },
          plate_recognition_enabled: {
            type: 'boolean',
            default: true
          },
          recognition_regions: {
            type: 'array',
            items: { type: 'string' },
            default: ['us', 'ca']
          },
          min_confidence: {
            type: 'number',
            minimum: 0.1,
            maximum: 1.0,
            default: 0.7
          },
          health_check_interval: {
            type: 'integer',
            minimum: 30000,
            maximum: 300000,
            default: 60000
          },
          metrics_enabled: {
            type: 'boolean',
            default: true
          },
          log_level: {
            type: 'string',
            enum: ['error', 'warn', 'info', 'debug'],
            default: 'info'
          }
        },
        required: ['rtsp_url']
      },
      device_type: 'raspberry-pi-4',
      is_default: true,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'High-Performance Camera Setup',
      description: 'Configuration for high-traffic locations with enhanced performance',
      version: '1.1.0',
      template: {
        stream: {
          rtspTransport: 'tcp',
          timeout: '{{stream_timeout}}',
          rtspUrl: '{{rtsp_url}}',
          bufferSize: '{{buffer_size}}'
        },
        snapshot: {
          interval: '{{snapshot_interval}}',
          quality: 1,
          maxCache: '{{max_cache_size}}',
          compressionEnabled: true
        },
        plateRecognizer: {
          enabled: true,
          regions: '{{recognition_regions}}',
          minConfidence: '{{min_confidence}}',
          batchProcessing: true,
          maxBatchSize: '{{batch_size}}'
        },
        monitoring: {
          healthCheckInterval: 30000,
          metricsEnabled: true,
          logLevel: 'info',
          performanceTracking: true
        },
        optimization: {
          cpuThrottling: false,
          memoryLimit: '{{memory_limit}}',
          diskCleanup: true,
          cacheOptimization: true
        }
      },
      schema: {
        type: 'object',
        properties: {
          stream_timeout: {
            type: 'integer',
            minimum: 10000,
            maximum: 60000,
            default: 20000
          },
          rtsp_url: {
            type: 'string',
            pattern: '^rtsp://.+$'
          },
          buffer_size: {
            type: 'integer',
            minimum: 1024,
            maximum: 8192,
            default: 4096
          },
          snapshot_interval: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            default: 3
          },
          max_cache_size: {
            type: 'integer',
            minimum: 100,
            maximum: 500,
            default: 200
          },
          recognition_regions: {
            type: 'array',
            items: { type: 'string' },
            default: ['us']
          },
          min_confidence: {
            type: 'number',
            minimum: 0.8,
            maximum: 1.0,
            default: 0.9
          },
          batch_size: {
            type: 'integer',
            minimum: 5,
            maximum: 20,
            default: 10
          },
          memory_limit: {
            type: 'string',
            default: '512M'
          }
        },
        required: ['rtsp_url']
      },
      device_type: 'raspberry-pi-4',
      is_default: false,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Legacy Device Configuration',
      description: 'Configuration for older Raspberry Pi 3 devices with limited resources',
      version: '1.0.0',
      template: {
        stream: {
          rtspTransport: 'tcp',
          timeout: '{{stream_timeout}}',
          rtspUrl: '{{rtsp_url}}'
        },
        snapshot: {
          interval: '{{snapshot_interval}}',
          quality: '{{snapshot_quality}}',
          maxCache: '{{max_cache_size}}'
        },
        plateRecognizer: {
          enabled: '{{plate_recognition_enabled}}',
          regions: '{{recognition_regions}}',
          minConfidence: '{{min_confidence}}'
        },
        monitoring: {
          healthCheckInterval: '{{health_check_interval}}',
          metricsEnabled: false,
          logLevel: 'warn'
        },
        optimization: {
          cpuThrottling: true,
          memoryLimit: '256M',
          diskCleanup: true,
          lowPowerMode: true
        }
      },
      schema: {
        type: 'object',
        properties: {
          stream_timeout: {
            type: 'integer',
            minimum: 15000,
            maximum: 60000,
            default: 45000
          },
          rtsp_url: {
            type: 'string',
            pattern: '^rtsp://.+$'
          },
          snapshot_interval: {
            type: 'integer',
            minimum: 5,
            maximum: 30,
            default: 10
          },
          snapshot_quality: {
            type: 'integer',
            minimum: 3,
            maximum: 5,
            default: 4
          },
          max_cache_size: {
            type: 'integer',
            minimum: 10,
            maximum: 100,
            default: 50
          },
          plate_recognition_enabled: {
            type: 'boolean',
            default: true
          },
          recognition_regions: {
            type: 'array',
            items: { type: 'string' },
            default: ['us']
          },
          min_confidence: {
            type: 'number',
            minimum: 0.5,
            maximum: 1.0,
            default: 0.6
          },
          health_check_interval: {
            type: 'integer',
            minimum: 60000,
            maximum: 300000,
            default: 120000
          }
        },
        required: ['rtsp_url']
      },
      device_type: 'raspberry-pi-3',
      is_default: true,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Security-Enhanced Configuration',
      description: 'High-security configuration with enhanced monitoring and logging',
      version: '1.0.0',
      template: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 25000,
          rtspUrl: '{{rtsp_url}}',
          encryption: true
        },
        snapshot: {
          interval: 2,
          quality: 1,
          maxCache: 300,
          encryption: true
        },
        plateRecognizer: {
          enabled: true,
          regions: '{{recognition_regions}}',
          minConfidence: 0.95,
          auditLog: true
        },
        monitoring: {
          healthCheckInterval: 30000,
          metricsEnabled: true,
          logLevel: 'debug',
          securityEvents: true,
          tamperDetection: true
        },
        security: {
          apiKeyRotation: true,
          encryptedStorage: true,
          accessLogging: true,
          failureAlerts: true
        },
        alerts: {
          webhookUrl: '{{security_webhook_url}}',
          emailNotifications: '{{security_email}}',
          smsAlerts: '{{security_phone}}'
        }
      },
      schema: {
        type: 'object',
        properties: {
          rtsp_url: {
            type: 'string',
            pattern: '^rtsp://.+$'
          },
          recognition_regions: {
            type: 'array',
            items: { type: 'string' },
            default: ['us', 'ca']
          },
          security_webhook_url: {
            type: 'string',
            pattern: '^https://.+$'
          },
          security_email: {
            type: 'string',
            format: 'email'
          },
          security_phone: {
            type: 'string',
            pattern: '^\\+?[1-9]\\d{1,14}$'
          }
        },
        required: ['rtsp_url', 'security_webhook_url']
      },
      device_type: 'raspberry-pi-4',
      is_default: false,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Development Testing Template',
      description: 'Configuration template for development and testing environments',
      version: '0.9.0-beta',
      template: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 30000,
          rtspUrl: '{{rtsp_url}}'
        },
        snapshot: {
          interval: 5,
          quality: 3,
          maxCache: 50
        },
        plateRecognizer: {
          enabled: false,
          regions: ['us'],
          minConfidence: 0.5
        },
        monitoring: {
          healthCheckInterval: 60000,
          metricsEnabled: true,
          logLevel: 'debug'
        },
        development: {
          mockData: true,
          testMode: true,
          debugEndpoints: true,
          verboseLogging: true
        }
      },
      schema: {
        type: 'object',
        properties: {
          rtsp_url: {
            type: 'string',
            pattern: '^rtsp://.+$'
          }
        },
        required: ['rtsp_url']
      },
      device_type: 'development',
      is_default: true,
      active: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Insert sample templates
  await knex('configuration_templates').insert(templates);
  
  console.log(`Seeded ${templates.length} sample configuration templates`);
};
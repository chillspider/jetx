const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('devices').del();

  // Sample devices for different car wash locations
  const devices = [
    {
      id: uuidv4(),
      device_id: 'CAM-MAIN-001',
      name: 'Main Entrance Camera',
      location: 'Downtown Car Wash - Main Street',
      site_code: 'DT-MAIN',
      ip_address: '192.168.1.101',
      port: 3000,
      rtsp_url: 'rtsp://192.168.1.101:554/stream1',
      api_key: crypto.randomBytes(32).toString('hex'),
      status: 'online',
      capabilities: {
        resolution: '1920x1080',
        fps: 30,
        night_vision: true,
        audio: false
      },
      configuration: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 30000,
          rtspUrl: 'rtsp://192.168.1.101:554/stream1'
        },
        snapshot: {
          interval: 5,
          quality: 2,
          maxCache: 100
        },
        plateRecognizer: {
          enabled: true,
          regions: ['us', 'ca'],
          minConfidence: 0.7
        }
      },
      metadata: {
        installation_date: '2024-01-15',
        last_maintenance: '2024-11-01',
        camera_angle: 'front-facing'
      },
      firmware_version: '2.1.4',
      model: 'RPi4-CAM-HD',
      serial_number: 'RPI4C001',
      last_seen: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      device_id: 'CAM-EXIT-001',
      name: 'Exit Lane Camera',
      location: 'Downtown Car Wash - Exit Lane',
      site_code: 'DT-MAIN',
      ip_address: '192.168.1.102',
      port: 3000,
      rtsp_url: 'rtsp://192.168.1.102:554/stream1',
      api_key: crypto.randomBytes(32).toString('hex'),
      status: 'online',
      capabilities: {
        resolution: '1920x1080',
        fps: 30,
        night_vision: true,
        audio: false
      },
      configuration: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 30000,
          rtspUrl: 'rtsp://192.168.1.102:554/stream1'
        },
        snapshot: {
          interval: 5,
          quality: 2,
          maxCache: 100
        },
        plateRecognizer: {
          enabled: true,
          regions: ['us', 'ca'],
          minConfidence: 0.7
        }
      },
      metadata: {
        installation_date: '2024-01-15',
        last_maintenance: '2024-11-01',
        camera_angle: 'rear-facing'
      },
      firmware_version: '2.1.4',
      model: 'RPi4-CAM-HD',
      serial_number: 'RPI4C002',
      last_seen: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      device_id: 'CAM-NORTH-001',
      name: 'North Side Entrance',
      location: 'North Plaza Car Wash - Entrance',
      site_code: 'NP-001',
      ip_address: '192.168.2.101',
      port: 3000,
      rtsp_url: 'rtsp://192.168.2.101:554/stream1',
      api_key: crypto.randomBytes(32).toString('hex'),
      status: 'online',
      capabilities: {
        resolution: '1920x1080',
        fps: 25,
        night_vision: true,
        audio: false
      },
      configuration: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 30000,
          rtspUrl: 'rtsp://192.168.2.101:554/stream1'
        },
        snapshot: {
          interval: 5,
          quality: 2,
          maxCache: 100
        },
        plateRecognizer: {
          enabled: true,
          regions: ['us'],
          minConfidence: 0.8
        }
      },
      metadata: {
        installation_date: '2024-02-01',
        last_maintenance: '2024-10-15',
        camera_angle: 'front-facing'
      },
      firmware_version: '2.1.3',
      model: 'RPi4-CAM-HD',
      serial_number: 'RPI4C003',
      last_seen: new Date(Date.now() - 60000), // 1 minute ago
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      device_id: 'CAM-SOUTH-001',
      name: 'South Location Main Camera',
      location: 'South Bay Car Wash - Main Tunnel',
      site_code: 'SB-001',
      ip_address: '192.168.3.101',
      port: 3000,
      rtsp_url: 'rtsp://192.168.3.101:554/stream1',
      api_key: crypto.randomBytes(32).toString('hex'),
      status: 'offline',
      capabilities: {
        resolution: '1280x720',
        fps: 20,
        night_vision: false,
        audio: false
      },
      configuration: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 30000,
          rtspUrl: 'rtsp://192.168.3.101:554/stream1'
        },
        snapshot: {
          interval: 10,
          quality: 3,
          maxCache: 50
        },
        plateRecognizer: {
          enabled: true,
          regions: ['us', 'mx'],
          minConfidence: 0.6
        }
      },
      metadata: {
        installation_date: '2024-01-20',
        last_maintenance: '2024-09-30',
        camera_angle: 'side-facing',
        issues: ['connection_intermittent']
      },
      firmware_version: '2.0.8',
      model: 'RPi3-CAM-STD',
      serial_number: 'RPI3C001',
      last_seen: new Date(Date.now() - 600000), // 10 minutes ago
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      device_id: 'CAM-WEST-001',
      name: 'West Side Security Camera',
      location: 'West Mall Car Wash - Security Position',
      site_code: 'WM-001',
      ip_address: '192.168.4.101',
      port: 3000,
      rtsp_url: 'rtsp://192.168.4.101:554/stream1',
      api_key: crypto.randomBytes(32).toString('hex'),
      status: 'maintenance',
      capabilities: {
        resolution: '1920x1080',
        fps: 30,
        night_vision: true,
        audio: true
      },
      configuration: {
        stream: {
          rtspTransport: 'tcp',
          timeout: 30000,
          rtspUrl: 'rtsp://192.168.4.101:554/stream1'
        },
        snapshot: {
          interval: 3,
          quality: 1,
          maxCache: 200
        },
        plateRecognizer: {
          enabled: false,
          regions: ['us'],
          minConfidence: 0.9
        }
      },
      metadata: {
        installation_date: '2024-03-01',
        last_maintenance: '2024-12-01',
        camera_angle: 'overhead',
        maintenance_reason: 'lens_cleaning'
      },
      firmware_version: '2.2.0-beta',
      model: 'RPi4-CAM-PRO',
      serial_number: 'RPI4C004',
      last_seen: new Date(Date.now() - 1800000), // 30 minutes ago
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Insert sample devices
  await knex('devices').insert(devices);
  
  console.log(`Seeded ${devices.length} sample devices`);
};
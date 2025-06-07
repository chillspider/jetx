 Mock API Service Design for Car Wash Fleet Management

  I'll design a comprehensive mock service running on port 3003 that supports all development phases. Here's what we need:

  Mock Service Structure

  mock-service/
  ├── src/
  │   ├── server.js              # Main mock server
  │   ├── generators/
  │   │   ├── deviceGenerator.js # Generate device data
  │   │   ├── plateGenerator.js  # Generate license plates
  │   │   ├── metricsGenerator.js # Generate metrics
  │   │   └── streamGenerator.js  # Generate RTSP data
  │   ├── routes/
  │   │   ├── rtsp.js           # Mock RTSP endpoints
  │   │   ├── plateRecognizer.js # Mock PlateRecognizer API
  │   │   ├── devices.js        # Mock device fleet
  │   │   ├── metrics.js        # Mock Prometheus metrics
  │   │   ├── webhooks.js       # Mock webhook receiver
  │   │   └── websocket.js      # Mock real-time updates
  │   ├── data/
  │   │   ├── devices.json      # Static device data
  │   │   ├── locations.json    # Car wash locations
  │   │   ├── plates.json       # Sample license plates
  │   │   └── configurations.json # Config templates
  │   └── utils/
  │       └── dataHelpers.js    # Data manipulation utilities
  ├── assets/
  │   ├── sample-snapshots/     # Sample JPEG images
  │   └── rtsp-samples/         # Sample stream data
  └── package.json

  Phase-by-Phase Mock API Requirements

  Phase 1: Pi Node Stack Mock APIs

  // Mock RTSP Stream Endpoint
  GET /mock/rtsp/stream/:deviceId
  Response: Simulated RTSP stream data or redirect to sample video

  // Mock Configuration Service
  GET /mock/config/:deviceId
  Response: {
    "device_id": "pi-001",
    "rtsp_url": "rtsp://mock-service:3003/stream/test",
    "snapshot_interval": 10,
    "quality": 3,
    "api_key": "mock-key-12345",
    "webhook_url": "http://localhost:3003/mock/webhooks/receive"
  }

  // Mock Snapshot Images
  GET /mock/snapshots/sample
  Response: Random JPEG image from pool with cars/license plates

  // Mock System Metrics
  GET /mock/system/metrics/:deviceId
  Response: {
    "cpu_usage": 45.2,
    "memory_usage": 512000000,
    "temperature": 52.3,
    "disk_usage": 65.4,
    "uptime": 86400
  }

  Phase 2: Cloud API & PlateRecognizer Mock APIs

  // Mock PlateRecognizer API
  POST /mock/platerecognizer/plate-reader
  Body: multipart/form-data with image
  Response: {
    "processing_time": 0.245,
    "results": [{
      "plate": "ABC1234",
      "confidence": 0.923,
      "region": { "code": "us-ca" },
      "vehicle": {
        "type": "Sedan",
        "color": "Blue",
        "make": "Toyota",
        "model": "Camry"
      },
      "box": {
        "xmin": 120, "ymin": 80,
        "xmax": 280, "ymax": 140
      }
    }]
  }

  // Mock Device Fleet
  GET /mock/fleet/devices
  Response: Array of 500+ mock devices with various statuses

  // Mock Device Registration
  POST /mock/fleet/register
  Response: {
    "device_id": "pi-new-001",
    "api_key": "generated-key-xyz",
    "configuration": { ... }
  }

  // Mock Webhook Receiver
  POST /mock/webhooks/receive
  Response: 200 OK (logs webhook data)

  // Mock Bulk Operations
  POST /mock/fleet/bulk-update
  Response: {
    "updated": 150,
    "failed": 5,
    "errors": [...]
  }

  Phase 3: Web Dashboard Mock APIs

  // Mock Real-time WebSocket
  WS /mock/ws/fleet-updates
  Sends: {
    "type": "device_status_change",
    "device_id": "pi-123",
    "status": "online",
    "timestamp": "2024-01-10T10:30:00Z"
  }

  // Mock Fleet Overview
  GET /mock/dashboard/overview
  Response: {
    "total_locations": 523,
    "online_devices": 498,
    "offline_devices": 25,
    "plates_today": 15234,
    "success_rate": 94.2,
    "alerts_active": 3
  }

  // Mock Historical Data
  GET /mock/analytics/history
  Query: ?device_id=pi-001&metric=plates&range=7d
  Response: Time-series data for charts

  // Mock User Authentication
  POST /mock/auth/login
  Response: {
    "token": "mock-jwt-token",
    "user": { "id": 1, "role": "admin" }
  }

  // Mock Geographic Data
  GET /mock/locations/map
  Response: GeoJSON with all location coordinates

  Phase 4: Prometheus Monitoring Mock APIs

  // Mock Prometheus Metrics Endpoint
  GET /mock/metrics/:deviceId
  Response: (Prometheus format)
  # HELP carwash_ffmpeg_process_status FFmpeg process status
  # TYPE carwash_ffmpeg_process_status gauge
  carwash_ffmpeg_process_status{device="pi-001"} 1

  # HELP carwash_snapshot_generation_rate Snapshots per minute
  # TYPE carwash_snapshot_generation_rate gauge
  carwash_snapshot_generation_rate{device="pi-001"} 6

  // Mock Grafana Data Source
  GET /mock/grafana/query
  POST /mock/grafana/query
  Response: Time-series data in Grafana format

  // Mock Alert Manager
  GET /mock/alerts/active
  Response: [{
    "alertname": "DeviceOffline",
    "device": "pi-045",
    "severity": "critical",
    "startsAt": "2024-01-10T09:00:00Z"
  }]

  Phase 5: Self-Healing Mock APIs

  // Mock Failure Scenarios
  POST /mock/simulate/failure/:deviceId
  Body: { "type": "ffmpeg_crash" | "network_loss" | "high_temp" }
  Response: Simulates the failure condition

  // Mock Recovery Actions
  POST /mock/recovery/action
  Body: { "device_id": "pi-001", "action": "restart_ffmpeg" }
  Response: { "success": true, "recovered_at": "..." }

  // Mock Health Patterns
  GET /mock/health/patterns/:deviceId
  Response: Historical health patterns with anomalies

  Phase 6: Auto-Discovery Mock APIs

  // Mock Device Discovery
  GET /mock/discovery/scan
  Response: [{
    "mac_address": "b8:27:eb:12:34:56",
    "ip_address": "192.168.1.100",
    "hostname": "raspberrypi",
    "detected_at": "2024-01-10T11:00:00Z"
  }]

  // Mock Auto-Registration
  POST /mock/discovery/auto-register
  Response: {
    "device_id": "pi-auto-001",
    "configuration_applied": true
  }

  Mock Data Generators

  // deviceGenerator.js
  class DeviceGenerator {
    generateDevice(index) {
      return {
        device_id: `pi-${String(index).padStart(3, '0')}`,
        location_id: `loc-${Math.floor(index / 10)}`,
        name: `CarWash ${faker.company.name()} #${index}`,
        ip_address: `10.0.${Math.floor(index / 250)}.${index % 250}`,
        status: this.randomStatus(),
        last_seen: this.recentTimestamp(),
        configuration: this.generateConfig(),
        metrics: this.generateMetrics()
      };
    }

    randomStatus() {
      const statuses = ['online', 'online', 'online', 'offline', 'error'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }
  }

  // plateGenerator.js
  class PlateGenerator {
    generatePlate() {
      const formats = [
        () => `${this.letters(3)}${this.numbers(4)}`, // ABC1234
        () => `${this.numbers(3)}-${this.letters(3)}`, // 123-ABC
        () => `${this.letters(2)}-${this.numbers(5)}`, // AB-12345
      ];
      return formats[Math.floor(Math.random() * formats.length)]();
    }

    generateVehicle() {
      const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW'];
      const types = ['Sedan', 'SUV', 'Truck', 'Van', 'Coupe'];
      const colors = ['Black', 'White', 'Silver', 'Blue', 'Red'];

      return {
        make: makes[Math.floor(Math.random() * makes.length)],
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }
  }

  Sample Static Data Files

  // data/locations.json
  {
    "locations": [
      {
        "id": "loc-001",
        "name": "Downtown Car Wash",
        "address": "123 Main St, City, State",
        "coordinates": { "lat": 34.0522, "lng": -118.2437 },
        "devices": ["pi-001", "pi-002"],
        "timezone": "America/Los_Angeles"
      }
    ]
  }

  // data/configurations.json
  {
    "templates": [
      {
        "id": "template-standard",
        "name": "Standard Configuration",
        "rtsp_url": "rtsp://camera.local/stream",
        "snapshot_interval": 10,
        "quality": 3,
        "retry_attempts": 5
      }
    ]
  }

  Mock Service Implementation

  // server.js - Main mock service
  const express = require('express');
  const cors = require('cors');
  const WebSocket = require('ws');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Import route handlers
  const rtspRoutes = require('./routes/rtsp');
  const plateRecognizerRoutes = require('./routes/plateRecognizer');
  const deviceRoutes = require('./routes/devices');
  const metricsRoutes = require('./routes/metrics');

  // Mount routes
  app.use('/mock/rtsp', rtspRoutes);
  app.use('/mock/platerecognizer', plateRecognizerRoutes);
  app.use('/mock/fleet', deviceRoutes);
  app.use('/mock/metrics', metricsRoutes);

  // WebSocket server for real-time updates
  const wss = new WebSocket.Server({ port: 3004 });

  // Simulate real-time updates
  setInterval(() => {
    const update = {
      type: 'device_status_change',
      device_id: `pi-${Math.floor(Math.random() * 500)}`,
      status: Math.random() > 0.9 ? 'offline' : 'online',
      timestamp: new Date().toISOString()
    };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  }, 5000);

  app.listen(3003, () => {
    console.log('Mock service running on port 3003');
    console.log('WebSocket server running on port 3004');
  });

  Benefits of This Mock Service

  1. Independent Development: Each phase can be developed without waiting for dependencies
  2. Consistent Testing: Predictable data for testing and demos
  3. Load Testing: Can simulate 500+ devices for performance testing
  4. Failure Simulation: Test self-healing and error handling
  5. Demo Ready: Always have working endpoints for stakeholders
  6. CI/CD Integration: Automated tests can use mock service

  This comprehensive mock service ensures smooth development across all phases while providing realistic data and scenarios for testing the entire
  car wash fleet management system.




TODO: 
     ☒ Create project structure
     ☒ Set up package.json with dependencies
     ☒ Create configuration files (default and production)
     ☒ Implement all services
     ☒ Create API controllers for snapshots, health, config
     ☒ Create main app.js entry point
     ☒ Build comprehensive unit tests for all services and controllers
     ☒ Create logger and metrics utilities
     ☒ Implement auth, rate limit, error handling middleware
     ☒ Set up Express routes
     ☒ Create installation and systemd scripts
     ☒ Create data flow and service interaction diagrams
     ☐ Create comprehensive file and folder inventory list
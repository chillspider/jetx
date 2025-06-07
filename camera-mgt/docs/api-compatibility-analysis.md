# API Compatibility Analysis: Phase 1 Pi-Node ↔ Phase 2 Cloud API

## 🔍 **Current Integration Issues and Solutions**

Based on the analysis of Phase 1 (Pi-Node) and Phase 2 (Cloud API) implementations, here are the integration requirements and necessary modifications:

## 📋 **Required API Endpoints for Pi-Node Integration**

### **1. Device Configuration Endpoint**

**Pi-Node Code Expects:**
```javascript
// From configManager.js line 142-151
const response = await axios.get(
  `${this.config.cloud.apiUrl}/api/devices/${this.config.cloud.deviceId}/config`,
  {
    headers: {
      'Authorization': `Bearer ${this.config.api.key}`,
      'X-Device-ID': this.config.cloud.deviceId
    },
    timeout: 30000
  }
);
```

**Cloud API Must Provide:**
```javascript
// MISSING - Need to add to deviceController.js
async getDeviceConfiguration(req, res) {
  try {
    const { deviceId } = req.params;
    const device = await deviceService.getDeviceByDeviceId(deviceId);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      configuration: device.configuration,
      last_updated: device.updated_at
    });
  } catch (error) {
    // Error handling
  }
}
```

### **2. Device Status Update Endpoint**

**Pi-Node Code Expects:**
```javascript
// From healthMonitor.js - Pi will need to send status updates
// We need to add this capability to Pi-Node
async reportStatusToCloud() {
  const status = {
    status: this.healthStatus.overall,
    system: this.stats,
    stream_status: this.healthStatus.stream,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  await axios.post(
    `${this.config.cloud.apiUrl}/api/devices/${this.config.cloud.deviceId}/status`,
    status,
    {
      headers: {
        'X-API-Key': this.config.api.key,
        'X-Device-ID': this.config.cloud.deviceId
      }
    }
  );
}
```

**Cloud API Already Has:**
```javascript
// ✅ EXISTS in deviceController.js
router.post('/:device_id/status', 
  authMiddleware.validateDeviceOwnership,
  validationMiddleware.validateDeviceStatus(),
  asyncHandler(deviceController.updateDeviceStatus)
);
```

### **3. Plate Recognition Upload Endpoint**

**Pi-Node Needs to Add:**
```javascript
// NEW - Add to Pi-Node snapshotController.js
async sendToCloudForRecognition(snapshot) {
  const formData = new FormData();
  formData.append('image', snapshot.buffer, 'snapshot.jpg');
  formData.append('device_id', this.config.cloud.deviceId);
  formData.append('timestamp', snapshot.timestamp);
  
  try {
    const response = await axios.post(
      `${this.config.cloud.apiUrl}/api/plates/recognize`,
      formData,
      {
        headers: {
          'X-API-Key': this.config.api.key,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    logger.error('Failed to send snapshot for recognition:', error);
    throw error;
  }
}
```

**Cloud API Already Has:**
```javascript
// ✅ EXISTS in plateController.js
router.post('/recognize', 
  upload.single('image'),
  validationMiddleware.validateFileUpload(),
  asyncHandler(plateController.recognizePlateFromFile)
);
```

## 🔧 **Required Modifications**

### **Phase 1 (Pi-Node) Modifications**

#### **1. Add Cloud Reporting to Health Monitor**

```javascript
// Add to pi-node/src/services/healthMonitor.js

async startCloudReporting() {
  if (!this.config.cloud || !this.config.cloud.apiUrl) {
    return;
  }
  
  // Report status every minute
  this.cloudReportInterval = setInterval(async () => {
    await this.reportStatusToCloud();
  }, 60000);
}

async reportStatusToCloud() {
  try {
    const statusData = {
      status: this.healthStatus.overall === 'healthy' ? 'online' : 'error',
      metadata: {
        cpu_usage: this.stats.cpu.usage,
        memory_usage: this.stats.memory.percentage,
        disk_usage: this.stats.disk.percentage,
        temperature: this.stats.cpu.temperature,
        uptime: process.uptime(),
        stream_status: this.healthStatus.stream,
        last_snapshot: this.services.snapshotCache.getLatest()?.timestamp
      }
    };
    
    await axios.post(
      `${this.config.cloud.apiUrl}/api/devices/${this.config.cloud.deviceId}/status`,
      statusData,
      {
        headers: {
          'X-API-Key': this.config.api.key
        },
        timeout: 15000
      }
    );
    
    logger.debug('Status reported to cloud successfully');
  } catch (error) {
    logger.error('Failed to report status to cloud:', error.message);
  }
}
```

#### **2. Add Plate Recognition Integration**

```javascript
// Add to pi-node/src/services/plateRecognitionIntegration.js

class PlateRecognitionIntegration {
  constructor(services) {
    this.services = services;
    this.config = services.configManager.getConfig();
    this.enabled = this.config.plateRecognition?.enabled || false;
    this.processingQueue = [];
    this.isProcessing = false;
  }

  async start() {
    if (!this.enabled || !this.config.cloud?.apiUrl) {
      logger.info('Plate recognition integration disabled');
      return;
    }
    
    // Listen for new snapshots
    this.services.snapshotCache.on('snapshotAdded', (snapshot) => {
      this.queueForRecognition(snapshot);
    });
    
    // Start processing queue
    this.startQueueProcessor();
    
    logger.info('Plate recognition integration started');
  }

  queueForRecognition(snapshot) {
    this.processingQueue.push(snapshot);
  }

  async startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }
      
      this.isProcessing = true;
      const snapshot = this.processingQueue.shift();
      
      try {
        await this.processSnapshot(snapshot);
      } catch (error) {
        logger.error('Failed to process snapshot for recognition:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000); // Process every 5 seconds
  }

  async processSnapshot(snapshot) {
    const formData = new FormData();
    formData.append('image', snapshot.buffer, {
      filename: `snapshot-${snapshot.id}.jpg`,
      contentType: 'image/jpeg'
    });
    formData.append('device_id', this.config.cloud.deviceId);
    
    const response = await axios.post(
      `${this.config.cloud.apiUrl}/api/plates/recognize`,
      formData,
      {
        headers: {
          'X-API-Key': this.config.api.key,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );
    
    logger.info('Plate recognition result:', response.data);
    return response.data;
  }
}

module.exports = PlateRecognitionIntegration;
```

#### **3. Update Default Configuration**

```javascript
// Update pi-node/src/config/default.js to include cloud settings

module.exports = {
  // ... existing config ...
  
  cloud: {
    apiUrl: process.env.CLOUD_API_URL || 'http://localhost:3003/api',
    deviceId: process.env.DEVICE_ID || 'CAM-LOCAL-001',
    syncInterval: parseInt(process.env.CLOUD_SYNC_INTERVAL) || 60000,
    enabled: process.env.CLOUD_INTEGRATION_ENABLED !== 'false'
  },
  
  plateRecognition: {
    enabled: process.env.PLATE_RECOGNITION_ENABLED === 'true',
    minConfidence: parseFloat(process.env.PLATE_MIN_CONFIDENCE) || 0.7,
    processingInterval: parseInt(process.env.PLATE_PROCESSING_INTERVAL) || 5000
  }
};
```

### **Phase 2 (Cloud API) Modifications**

#### **1. Add Missing Device Configuration Endpoint**

```javascript
// Add to cloud-api/src/controllers/deviceController.js

async getDeviceConfiguration(req, res) {
  try {
    const { deviceId } = req.params;
    
    // Support both UUID and device_id lookup
    let device;
    if (deviceId.includes('-') && deviceId.length === 36) {
      device = await deviceService.getDeviceById(deviceId);
    } else {
      device = await deviceService.getDeviceByDeviceId(deviceId);
    }
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
        error: 'DEVICE_NOT_FOUND'
      });
    }
    
    // Return configuration in the format Pi-Node expects
    res.json({
      success: true,
      configuration: device.configuration || {},
      device_info: {
        id: device.id,
        device_id: device.device_id,
        name: device.name,
        last_updated: device.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching device configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device configuration',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}
```

#### **2. Update Device Routes**

```javascript
// Update cloud-api/src/routes/devices.js

// Add route for device configuration (Pi-Node compatible)
router.get('/:deviceId/config', 
  authMiddleware.authenticate, // Supports both JWT and API key
  asyncHandler(deviceController.getDeviceConfiguration)
);
```

#### **3. Enhanced Authentication for Device API Keys**

```javascript
// Update cloud-api/src/middleware/auth.js

async authenticate(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    // Check for API key first (device authentication)
    if (apiKey) {
      const device = await deviceService.getDeviceByApiKey(apiKey);
      
      if (!device) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key',
          error: 'INVALID_API_KEY'
        });
      }

      // Update last seen timestamp
      await deviceService.updateDeviceStatus(device.device_id, device.status, {
        last_api_call: new Date().toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      req.device = device;
      req.auth = {
        type: 'device',
        device_id: device.device_id,
        api_key: apiKey
      };

      return next();
    }

    // ... rest of JWT authentication logic
  } catch (error) {
    // ... error handling
  }
}
```

## 📊 **Data Exchange Formats**

### **Configuration Sync Format**

```json
{
  "success": true,
  "configuration": {
    "stream": {
      "rtspUrl": "rtsp://192.168.1.101:554/stream1",
      "rtspTransport": "tcp",
      "timeout": 30000,
      "reconnectDelay": 5000,
      "maxRetries": 5
    },
    "snapshot": {
      "interval": 10,
      "quality": 3,
      "cacheSize": 10,
      "cacheTTL": 300,
      "maxSize": 5242880
    },
    "plateRecognition": {
      "enabled": true,
      "minConfidence": 0.7,
      "regions": ["us", "ca"]
    },
    "cloud": {
      "apiUrl": "http://localhost:3003/api",
      "syncInterval": 60000
    }
  },
  "device_info": {
    "id": "device-uuid",
    "device_id": "CAM-MAIN-001",
    "name": "Main Entrance Camera",
    "last_updated": "2024-12-07T10:30:00Z"
  }
}
```

### **Status Update Format**

```json
{
  "status": "online",
  "metadata": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 23.1,
    "temperature": 52.3,
    "uptime": 86400,
    "stream_status": "healthy",
    "last_snapshot": "2024-12-07T10:29:55Z",
    "snapshot_count": 1440,
    "error_count": 0
  }
}
```

### **Plate Recognition Request Format**

```javascript
// FormData request
const formData = new FormData();
formData.append('image', imageBuffer, 'snapshot.jpg');
formData.append('device_id', 'CAM-MAIN-001');
formData.append('timestamp', '2024-12-07T10:30:00Z');
formData.append('regions', 'us,ca');
```

### **Plate Recognition Response Format**

```json
{
  "success": true,
  "message": "Plate recognition completed successfully",
  "data": {
    "id": "recognition-uuid",
    "plate_number": "ABC123",
    "confidence": 0.95,
    "region": "us",
    "bounding_box": {
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 80
    },
    "device_id": "CAM-MAIN-001",
    "recognized_at": "2024-12-07T10:30:00Z"
  },
  "processing_time_ms": 1250
}
```

## ✅ **Implementation Checklist**

### **Phase 1 (Pi-Node) Updates**
- [ ] Add cloud reporting to health monitor
- [ ] Implement plate recognition integration service  
- [ ] Update configuration schema for cloud settings
- [ ] Add plate recognition configuration options
- [ ] Update systemd service to include cloud integration
- [ ] Add environment variables for cloud API URL and device ID

### **Phase 2 (Cloud API) Updates**
- [ ] Add device configuration endpoint (`GET /api/devices/:deviceId/config`)
- [ ] Update authentication to track device last seen on API calls
- [ ] Ensure plate recognition endpoint accepts device_id parameter
- [ ] Add device heartbeat/status tracking
- [ ] Update API documentation for Pi-Node integration

### **Integration Testing**
- [ ] Test configuration sync from cloud to Pi-Node
- [ ] Test status reporting from Pi-Node to cloud
- [ ] Test plate recognition upload from Pi-Node to cloud
- [ ] Test authentication with device API keys
- [ ] Test error handling and retry logic
- [ ] Test configuration hot-reload on Pi-Node

### **Web Frontend Integration**
- [ ] Add device configuration management UI
- [ ] Add real-time status monitoring for Pi-Nodes
- [ ] Add direct Pi-Node snapshot viewing
- [ ] Add plate recognition results dashboard
- [ ] Add webhook configuration and testing UI

This analysis ensures complete compatibility and seamless integration between all three phases of the CarWash Fleet Management System.
import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Device API
export const deviceAPI = {
  // Get all devices with filtering
  getDevices: (params = {}) => api.get('/devices', { params }),
  
  // Get device by ID
  getDevice: (id) => api.get(`/devices/${id}`),
  
  // Register new device
  registerDevice: (deviceData) => api.post('/devices', deviceData),
  
  // Update device
  updateDevice: (id, updates) => api.put(`/devices/${id}`, updates),
  
  // Delete device
  deleteDevice: (id) => api.delete(`/devices/${id}`),
  
  // Update device configuration
  updateDeviceConfig: (id, configuration) => 
    api.put(`/devices/${id}/configuration`, { configuration }),
  
  // Regenerate API key
  regenerateApiKey: (id) => api.post(`/devices/${id}/regenerate-key`),
  
  // Bulk operations
  bulkOperations: (operation, deviceIds, data) => 
    api.post('/devices/bulk', { operation, device_ids: deviceIds, data }),
  
  // Get device statistics
  getStats: () => api.get('/devices/stats'),
  
  // Get devices by site
  getDevicesBySite: (siteCode) => api.get(`/devices/site/${siteCode}`),
  
  // Update device status (used by Pi devices)
  updateStatus: (deviceId, status, metadata) => 
    api.post(`/devices/${deviceId}/status`, { status, metadata }),
};

// Plate Recognition API
export const plateAPI = {
  // Get plate recognitions
  getRecognitions: (params = {}) => api.get('/plates', { params }),
  
  // Get recognition by ID
  getRecognition: (id) => api.get(`/plates/${id}`),
  
  // Process image for plate recognition
  recognizeFromFile: (formData) => api.post('/plates/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Process image from URL
  recognizeFromUrl: (data) => api.post('/plates/recognize/url', data),
  
  // Get recognition statistics
  getStats: (params = {}) => api.get('/plates/stats', { params }),
};

// Webhook API
export const webhookAPI = {
  // Get all webhooks
  getWebhooks: (params = {}) => api.get('/webhooks', { params }),
  
  // Get webhook by ID
  getWebhook: (id) => api.get(`/webhooks/${id}`),
  
  // Create webhook
  createWebhook: (webhookData) => api.post('/webhooks', webhookData),
  
  // Update webhook
  updateWebhook: (id, updates) => api.put(`/webhooks/${id}`, updates),
  
  // Delete webhook
  deleteWebhook: (id) => api.delete(`/webhooks/${id}`),
  
  // Test webhook
  testWebhook: (id) => api.post(`/webhooks/${id}/test`),
  
  // Get delivery history
  getDeliveryHistory: (params = {}) => api.get('/webhooks/deliveries', { params }),
  
  // Get webhook statistics
  getStats: (webhookId) => api.get('/webhooks/stats', { 
    params: webhookId ? { webhook_id: webhookId } : {} 
  }),
};

// Configuration Template API
export const templateAPI = {
  // Get all templates
  getTemplates: (params = {}) => api.get('/templates', { params }),
  
  // Get template by ID
  getTemplate: (id) => api.get(`/templates/${id}`),
  
  // Create template
  createTemplate: (templateData) => api.post('/templates', templateData),
  
  // Update template
  updateTemplate: (id, updates) => api.put(`/templates/${id}`, updates),
  
  // Delete template
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  
  // Generate configuration from template
  generateConfig: (id, variables) => api.post(`/templates/${id}/generate`, { variables }),
  
  // Apply template to devices
  applyTemplate: (id, deviceIds, variables) => 
    api.post(`/templates/${id}/apply`, { device_ids: deviceIds, variables }),
  
  // Clone template
  cloneTemplate: (id, name, version) => 
    api.post(`/templates/${id}/clone`, { name, version }),
  
  // Validate template
  validateTemplate: (id) => api.post(`/templates/${id}/validate`),
  
  // Get default template for device type
  getDefaultTemplate: (deviceType) => api.get(`/templates/default/${deviceType}`),
  
  // Get template usage statistics
  getUsage: () => api.get('/templates/usage'),
};

// Health and Monitoring API
export const healthAPI = {
  // Basic health check
  getHealth: () => api.get('/health'),
  
  // Detailed health check
  getDetailedHealth: () => api.get('/health/detailed'),
  
  // Database health
  getDatabaseHealth: () => api.get('/health/database'),
  
  // External services health
  getServicesHealth: () => api.get('/health/services'),
  
  // Application metrics
  getMetrics: () => api.get('/health/metrics'),
  
  // Readiness probe
  getReadiness: () => api.get('/health/ready'),
  
  // Liveness probe
  getLiveness: () => api.get('/health/live'),
};

// Pi-Node Integration API (for communicating with individual Pi devices)
export const piNodeAPI = {
  // Get snapshot from Pi device
  getSnapshot: (deviceIp, apiKey) => 
    axios.get(`http://${deviceIp}:3000/api/snapshot`, {
      headers: { 'X-API-Key': apiKey },
      responseType: 'blob',
      timeout: 10000,
    }),
  
  // Get snapshot info from Pi device
  getSnapshotInfo: (deviceIp, apiKey) =>
    axios.get(`http://${deviceIp}:3000/api/snapshot/info`, {
      headers: { 'X-API-Key': apiKey },
      timeout: 10000,
    }),
  
  // Get Pi device health
  getPiHealth: (deviceIp, apiKey) =>
    axios.get(`http://${deviceIp}:3000/api/health`, {
      headers: { 'X-API-Key': apiKey },
      timeout: 10000,
    }),
  
  // Get Pi device metrics
  getPiMetrics: (deviceIp, apiKey) =>
    axios.get(`http://${deviceIp}:3000/metrics`, {
      headers: { 'X-API-Key': apiKey },
      timeout: 10000,
    }),
  
  // Update Pi device configuration
  updatePiConfig: (deviceIp, apiKey, config) =>
    axios.post(`http://${deviceIp}:3000/api/config`, config, {
      headers: { 'X-API-Key': apiKey },
      timeout: 15000,
    }),
};

export default api;
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const config = require('../config/default');

class PlateRecognizerService {
  constructor() {
    this.apiKey = config.plateRecognizer.apiKey;
    this.apiUrl = config.plateRecognizer.apiUrl;
    this.timeout = config.plateRecognizer.timeout;
    this.regions = config.plateRecognizer.regions;
    this.minConfidence = config.plateRecognizer.minConfidence;
    
    if (!this.apiKey) {
      console.warn('PlateRecognizer API key not configured');
    }

    // Setup axios instance
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Token ${this.apiKey}`
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`PlateRecognizer API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('PlateRecognizer API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`PlateRecognizer API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('PlateRecognizer API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Recognize license plate from image file
   */
  async recognizePlateFromFile(imagePath, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('PlateRecognizer API key not configured');
      }

      const startTime = Date.now();

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('upload', fs.createReadStream(imagePath));
      
      // Add regions if specified
      const regions = options.regions || this.regions;
      if (regions && regions.length > 0) {
        formData.append('regions', regions.join(','));
      }

      // Add other options
      if (options.camera_id) {
        formData.append('camera_id', options.camera_id);
      }

      if (options.timestamp) {
        formData.append('timestamp', options.timestamp);
      }

      if (options.mmc !== undefined) {
        formData.append('mmc', options.mmc);
      }

      // Make API request
      const response = await this.client.post('/plate-reader/', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      const processingTime = Date.now() - startTime;

      // Process response
      const result = this.processResponse(response.data, processingTime);
      
      console.log(`Plate recognition completed in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('Error recognizing plate from file:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Recognize license plate from image buffer
   */
  async recognizePlateFromBuffer(imageBuffer, filename, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('PlateRecognizer API key not configured');
      }

      const startTime = Date.now();

      // Create form data
      const formData = new FormData();
      formData.append('upload', imageBuffer, {
        filename: filename || 'image.jpg',
        contentType: 'image/jpeg'
      });
      
      // Add regions if specified
      const regions = options.regions || this.regions;
      if (regions && regions.length > 0) {
        formData.append('regions', regions.join(','));
      }

      // Add other options
      if (options.camera_id) {
        formData.append('camera_id', options.camera_id);
      }

      if (options.timestamp) {
        formData.append('timestamp', options.timestamp);
      }

      if (options.mmc !== undefined) {
        formData.append('mmc', options.mmc);
      }

      // Make API request
      const response = await this.client.post('/plate-reader/', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      const processingTime = Date.now() - startTime;

      // Process response
      const result = this.processResponse(response.data, processingTime);
      
      console.log(`Plate recognition completed in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('Error recognizing plate from buffer:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Recognize license plate from URL
   */
  async recognizePlateFromUrl(imageUrl, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('PlateRecognizer API key not configured');
      }

      const startTime = Date.now();

      // Create form data
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      
      // Add regions if specified
      const regions = options.regions || this.regions;
      if (regions && regions.length > 0) {
        formData.append('regions', regions.join(','));
      }

      // Add other options
      if (options.camera_id) {
        formData.append('camera_id', options.camera_id);
      }

      if (options.timestamp) {
        formData.append('timestamp', options.timestamp);
      }

      if (options.mmc !== undefined) {
        formData.append('mmc', options.mmc);
      }

      // Make API request
      const response = await this.client.post('/plate-reader/', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      const processingTime = Date.now() - startTime;

      // Process response
      const result = this.processResponse(response.data, processingTime);
      
      console.log(`Plate recognition completed in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('Error recognizing plate from URL:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process PlateRecognizer API response
   */
  processResponse(data, processingTime) {
    const results = data.results || [];
    
    // Filter results by minimum confidence
    const validResults = results.filter(result => 
      result.score >= this.minConfidence
    );

    // Sort by confidence (highest first)
    validResults.sort((a, b) => b.score - a.score);

    const processedResults = validResults.map(result => ({
      plate_number: result.plate,
      confidence: result.score,
      region: result.region?.code || null,
      vehicle_type: result.vehicle?.type || null,
      bounding_box: result.box,
      candidates: result.candidates || []
    }));

    return {
      success: true,
      processing_time_ms: processingTime,
      total_results: results.length,
      valid_results: validResults.length,
      best_result: processedResults[0] || null,
      all_results: processedResults,
      raw_response: data
    };
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return new Error(`Bad request: ${data.message || 'Invalid image or parameters'}`);
        case 401:
          return new Error('Unauthorized: Invalid API key');
        case 403:
          return new Error('Forbidden: API key lacks permissions or quota exceeded');
        case 404:
          return new Error('Not found: Invalid API endpoint');
        case 429:
          return new Error('Rate limit exceeded: Too many requests');
        case 500:
          return new Error('PlateRecognizer API internal error');
        default:
          return new Error(`PlateRecognizer API error: ${status} - ${data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error: Could not reach PlateRecognizer API');
    } else {
      // Other error
      return error;
    }
  }

  /**
   * Check API status and quotas
   */
  async getApiStatus() {
    try {
      if (!this.apiKey) {
        throw new Error('PlateRecognizer API key not configured');
      }

      const response = await this.client.get('/statistics/');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting API status:', error);
      return {
        success: false,
        error: this.handleError(error).message
      };
    }
  }

  /**
   * Validate image before processing
   */
  validateImage(imagePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        return { valid: false, error: 'File not found' };
      }

      // Check file size (max 10MB)
      const stats = fs.statSync(imagePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        return { valid: false, error: 'File size too large (max 10MB)' };
      }

      // Check file extension
      const ext = path.extname(imagePath).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
      
      if (!allowedExtensions.includes(ext)) {
        return { valid: false, error: 'Invalid file format' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = new PlateRecognizerService();
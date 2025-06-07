const db = require('../config/database');
const axios = require('axios');
const crypto = require('crypto');
const cron = require('node-cron');
const config = require('../config/default');
const { v4: uuidv4 } = require('uuid');

class WebhookService {
  constructor() {
    this.webhooksTable = 'webhooks';
    this.deliveriesTable = 'webhook_deliveries';
    this.isProcessing = false;
    
    // Start webhook processor
    this.startWebhookProcessor();
  }

  /**
   * Create a new webhook
   */
  async createWebhook(webhookData) {
    const webhook = {
      id: uuidv4(),
      name: webhookData.name,
      url: webhookData.url,
      method: webhookData.method || 'POST',
      headers: webhookData.headers || {},
      event_type: webhookData.event_type,
      active: webhookData.active !== false,
      secret: webhookData.secret || crypto.randomBytes(32).toString('hex'),
      timeout_ms: webhookData.timeout_ms || config.webhook.defaultTimeout,
      retry_attempts: webhookData.retry_attempts || config.webhook.maxRetries,
      retry_delay_ms: webhookData.retry_delay_ms || config.webhook.retryDelay,
      filter_conditions: webhookData.filter_conditions || {},
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdWebhook] = await db(this.webhooksTable)
      .insert(webhook)
      .returning('*');

    return createdWebhook;
  }

  /**
   * Get all webhooks with optional filtering
   */
  async getWebhooks(filters = {}) {
    let query = db(this.webhooksTable).select('*');

    if (filters.event_type) {
      query = query.where('event_type', filters.event_type);
    }

    if (filters.active !== undefined) {
      query = query.where('active', filters.active);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    query = query.orderBy('created_at', 'desc');

    return await query;
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(id) {
    return await db(this.webhooksTable)
      .where('id', id)
      .first();
  }

  /**
   * Update webhook
   */
  async updateWebhook(id, updateData) {
    const updated = {
      ...updateData,
      updated_at: new Date()
    };

    const [updatedWebhook] = await db(this.webhooksTable)
      .where('id', id)
      .update(updated)
      .returning('*');

    return updatedWebhook;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id) {
    const deletedRows = await db(this.webhooksTable)
      .where('id', id)
      .del();

    return deletedRows > 0;
  }

  /**
   * Trigger webhooks for a specific event
   */
  async triggerWebhooks(eventType, payload, options = {}) {
    try {
      // Get active webhooks for this event type
      const webhooks = await db(this.webhooksTable)
        .where('event_type', eventType)
        .where('active', true);

      if (webhooks.length === 0) {
        console.log(`No active webhooks found for event type: ${eventType}`);
        return;
      }

      // Filter webhooks based on conditions
      const filteredWebhooks = this.filterWebhooksByConditions(webhooks, payload);

      // Create delivery records for each webhook
      const deliveries = [];
      for (const webhook of filteredWebhooks) {
        const delivery = {
          id: uuidv4(),
          webhook_id: webhook.id,
          plate_recognition_id: payload.plate_recognition?.id || null,
          event_type: eventType,
          status: 'pending',
          attempts: 0,
          payload: this.preparePayload(payload, webhook),
          scheduled_at: options.delay ? new Date(Date.now() + options.delay) : new Date(),
          created_at: new Date()
        };

        deliveries.push(delivery);
      }

      if (deliveries.length > 0) {
        await db(this.deliveriesTable).insert(deliveries);
        console.log(`Scheduled ${deliveries.length} webhook deliveries for event: ${eventType}`);
      }

    } catch (error) {
      console.error('Error triggering webhooks:', error);
      throw error;
    }
  }

  /**
   * Filter webhooks based on their filter conditions
   */
  filterWebhooksByConditions(webhooks, payload) {
    return webhooks.filter(webhook => {
      const conditions = webhook.filter_conditions;
      
      if (!conditions || Object.keys(conditions).length === 0) {
        return true; // No conditions, include webhook
      }

      // Check plate number filter
      if (conditions.plate_regex && payload.plate_recognition?.plate_number) {
        const regex = new RegExp(conditions.plate_regex, 'i');
        if (!regex.test(payload.plate_recognition.plate_number)) {
          return false;
        }
      }

      // Check confidence filter
      if (conditions.min_confidence && payload.plate_recognition?.confidence) {
        if (payload.plate_recognition.confidence < conditions.min_confidence) {
          return false;
        }
      }

      // Check site code filter
      if (conditions.site_codes && payload.device?.site_code) {
        if (!conditions.site_codes.includes(payload.device.site_code)) {
          return false;
        }
      }

      // Check device filter
      if (conditions.device_ids && payload.device?.device_id) {
        if (!conditions.device_ids.includes(payload.device.device_id)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Prepare payload for webhook delivery
   */
  preparePayload(originalPayload, webhook) {
    const timestamp = new Date().toISOString();
    
    const payload = {
      event_type: webhook.event_type,
      timestamp: timestamp,
      webhook_id: webhook.id,
      data: originalPayload
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
      payload.signature = signature;
    }

    return payload;
  }

  /**
   * Generate webhook signature
   */
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Process pending webhook deliveries
   */
  async processWebhookDeliveries() {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;

    try {
      // Get pending deliveries
      const deliveries = await db(this.deliveriesTable)
        .join('webhooks', 'webhook_deliveries.webhook_id', 'webhooks.id')
        .select(
          'webhook_deliveries.*',
          'webhooks.url',
          'webhooks.method',
          'webhooks.headers',
          'webhooks.timeout_ms',
          'webhooks.retry_attempts',
          'webhooks.retry_delay_ms'
        )
        .where('webhook_deliveries.status', 'pending')
        .where('webhook_deliveries.scheduled_at', '<=', new Date())
        .limit(config.webhook.batchSize);

      if (deliveries.length === 0) {
        return;
      }

      console.log(`Processing ${deliveries.length} webhook deliveries`);

      // Process deliveries in parallel (but limited)
      const promises = deliveries.map(delivery => this.deliverWebhook(delivery));
      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Error processing webhook deliveries:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Deliver a single webhook
   */
  async deliverWebhook(delivery) {
    try {
      console.log(`Delivering webhook ${delivery.id} to ${delivery.url}`);

      // Prepare request
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'CarWash-Webhook/1.0',
        ...delivery.headers
      };

      // Add signature header if present
      if (delivery.payload.signature) {
        headers['X-Webhook-Signature'] = `sha256=${delivery.payload.signature}`;
      }

      const requestConfig = {
        method: delivery.method,
        url: delivery.url,
        headers: headers,
        data: delivery.payload,
        timeout: delivery.timeout_ms,
        validateStatus: (status) => status >= 200 && status < 300
      };

      // Make the request
      const startTime = Date.now();
      const response = await axios(requestConfig);
      const responseTime = Date.now() - startTime;

      // Update delivery as successful
      await db(this.deliveriesTable)
        .where('id', delivery.id)
        .update({
          status: 'delivered',
          attempts: delivery.attempts + 1,
          response_code: response.status,
          response_body: JSON.stringify(response.data).substring(0, 1000), // Limit size
          delivered_at: new Date()
        });

      console.log(`Webhook ${delivery.id} delivered successfully in ${responseTime}ms`);

    } catch (error) {
      console.error(`Webhook ${delivery.id} delivery failed:`, error.message);

      const newAttempts = delivery.attempts + 1;
      const maxAttempts = delivery.retry_attempts;

      if (newAttempts >= maxAttempts) {
        // Mark as failed
        await db(this.deliveriesTable)
          .where('id', delivery.id)
          .update({
            status: 'failed',
            attempts: newAttempts,
            response_code: error.response?.status || null,
            error_message: error.message.substring(0, 500)
          });

        console.log(`Webhook ${delivery.id} failed permanently after ${newAttempts} attempts`);
      } else {
        // Schedule retry
        const retryDelay = delivery.retry_delay_ms * Math.pow(2, newAttempts - 1); // Exponential backoff
        const nextAttempt = new Date(Date.now() + retryDelay);

        await db(this.deliveriesTable)
          .where('id', delivery.id)
          .update({
            status: 'pending',
            attempts: newAttempts,
            response_code: error.response?.status || null,
            error_message: error.message.substring(0, 500),
            scheduled_at: nextAttempt
          });

        console.log(`Webhook ${delivery.id} scheduled for retry ${newAttempts}/${maxAttempts} at ${nextAttempt}`);
      }
    }
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(filters = {}) {
    let query = db(this.deliveriesTable)
      .join('webhooks', 'webhook_deliveries.webhook_id', 'webhooks.id')
      .select(
        'webhook_deliveries.*',
        'webhooks.name as webhook_name',
        'webhooks.url'
      );

    if (filters.webhook_id) {
      query = query.where('webhook_deliveries.webhook_id', filters.webhook_id);
    }

    if (filters.status) {
      query = query.where('webhook_deliveries.status', filters.status);
    }

    if (filters.event_type) {
      query = query.where('webhook_deliveries.event_type', filters.event_type);
    }

    if (filters.start_date) {
      query = query.where('webhook_deliveries.created_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('webhook_deliveries.created_at', '<=', filters.end_date);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    query = query.orderBy('webhook_deliveries.created_at', 'desc');

    return await query;
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId = null) {
    let query = db(this.deliveriesTable);

    if (webhookId) {
      query = query.where('webhook_id', webhookId);
    }

    const stats = await query
      .select('status')
      .count('* as count')
      .groupBy('status');

    const total = await query.clone().count('id as total');

    return {
      total: parseInt(total[0].total),
      by_status: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {})
    };
  }

  /**
   * Start the webhook processor (runs every few seconds)
   */
  startWebhookProcessor() {
    // Process webhooks every 5 seconds
    cron.schedule('*/5 * * * * *', () => {
      this.processWebhookDeliveries().catch(error => {
        console.error('Webhook processor error:', error);
      });
    });

    console.log('Webhook processor started');
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(webhookId) {
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event_type: 'webhook_test',
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id,
      data: {
        message: 'This is a test webhook delivery',
        test: true
      }
    };

    // Create test delivery
    const delivery = {
      id: uuidv4(),
      webhook_id: webhook.id,
      event_type: 'webhook_test',
      status: 'pending',
      attempts: 0,
      payload: testPayload,
      scheduled_at: new Date(),
      created_at: new Date()
    };

    await db(this.deliveriesTable).insert(delivery);

    return {
      success: true,
      delivery_id: delivery.id,
      message: 'Test webhook scheduled for delivery'
    };
  }
}

module.exports = new WebhookService();
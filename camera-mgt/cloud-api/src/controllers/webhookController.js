const webhookService = require('../services/webhookService');
const { validationResult } = require('express-validator');

class WebhookController {
  /**
   * Create a new webhook
   */
  async createWebhook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const webhook = await webhookService.createWebhook(req.body);

      res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        data: webhook
      });
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create webhook',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get all webhooks with filtering
   */
  async getWebhooks(req, res) {
    try {
      const filters = {
        event_type: req.query.event_type,
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const webhooks = await webhookService.getWebhooks(filters);

      res.json({
        success: true,
        data: webhooks,
        count: webhooks.length
      });
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch webhooks',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(req, res) {
    try {
      const { id } = req.params;
      const webhook = await webhookService.getWebhookById(id);

      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found',
          error: 'WEBHOOK_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: webhook
      });
    } catch (error) {
      console.error('Error fetching webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch webhook',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(req, res) {
    try {
      const { id } = req.params;
      const webhook = await webhookService.updateWebhook(id, req.body);

      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found',
          error: 'WEBHOOK_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Webhook updated successfully',
        data: webhook
      });
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update webhook',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(req, res) {
    try {
      const { id } = req.params;
      const deleted = await webhookService.deleteWebhook(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found',
          error: 'WEBHOOK_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete webhook',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(req, res) {
    try {
      const { id } = req.params;
      const result = await webhookService.testWebhook(id);

      res.json({
        success: true,
        message: 'Test webhook scheduled successfully',
        data: result
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      
      if (error.message === 'Webhook not found') {
        return res.status(404).json({
          success: false,
          message: 'Webhook not found',
          error: 'WEBHOOK_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to test webhook',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(req, res) {
    try {
      const filters = {
        webhook_id: req.query.webhook_id,
        status: req.query.status,
        event_type: req.query.event_type,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const deliveries = await webhookService.getDeliveryHistory(filters);

      res.json({
        success: true,
        data: deliveries,
        count: deliveries.length
      });
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery history',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(req, res) {
    try {
      const webhookId = req.query.webhook_id || null;
      const stats = await webhookService.getWebhookStats(webhookId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching webhook statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch webhook statistics',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedDeliveries(req, res) {
    try {
      const { webhook_id, delivery_ids } = req.body;

      if (!webhook_id && !delivery_ids) {
        return res.status(400).json({
          success: false,
          message: 'Either webhook_id or delivery_ids must be provided',
          error: 'INVALID_REQUEST'
        });
      }

      // This would implement retry logic
      res.status(501).json({
        success: false,
        message: 'Retry functionality not yet implemented',
        error: 'NOT_IMPLEMENTED'
      });
    } catch (error) {
      console.error('Error retrying failed deliveries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry failed deliveries',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Bulk webhook operations
   */
  async bulkOperations(req, res) {
    try {
      const { operation, webhook_ids } = req.body;

      if (!operation || !webhook_ids || !Array.isArray(webhook_ids)) {
        return res.status(400).json({
          success: false,
          message: 'Operation and webhook_ids array are required',
          error: 'INVALID_REQUEST'
        });
      }

      // This would implement bulk operations
      res.status(501).json({
        success: false,
        message: 'Bulk operations not yet implemented',
        error: 'NOT_IMPLEMENTED'
      });
    } catch (error) {
      console.error('Error performing bulk operations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operations',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new WebhookController();
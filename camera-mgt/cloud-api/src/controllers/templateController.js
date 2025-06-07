const configTemplateService = require('../services/configTemplateService');
const { validationResult } = require('express-validator');

class TemplateController {
  /**
   * Create a new configuration template
   */
  async createTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const template = await configTemplateService.createTemplate(req.body);

      res.status(201).json({
        success: true,
        message: 'Configuration template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);

      if (error.message.includes('Template name already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Template name already exists',
          error: 'TEMPLATE_NAME_EXISTS'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get all templates with filtering
   */
  async getTemplates(req, res) {
    try {
      const filters = {
        device_type: req.query.device_type,
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        is_default: req.query.is_default === 'true' ? true : req.query.is_default === 'false' ? false : undefined,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const templates = await configTemplateService.getTemplates(filters);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await configTemplateService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get default template for device type
   */
  async getDefaultTemplate(req, res) {
    try {
      const { device_type } = req.params;
      const template = await configTemplateService.getDefaultTemplate(device_type);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: `No default template found for device type: ${device_type}`,
          error: 'DEFAULT_TEMPLATE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching default template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch default template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Update template
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await configTemplateService.updateTemplate(id, req.body);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      console.error('Error updating template:', error);

      if (error.message.includes('Template name already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Template name already exists',
          error: 'TEMPLATE_NAME_EXISTS'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const deleted = await configTemplateService.deleteTemplate(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);

      if (error.message.includes('Cannot delete default template')) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete default template',
          error: 'CANNOT_DELETE_DEFAULT'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Generate configuration from template
   */
  async generateConfiguration(req, res) {
    try {
      const { id } = req.params;
      const { variables = {} } = req.body;

      const result = await configTemplateService.generateConfiguration(id, variables);

      res.json({
        success: true,
        message: 'Configuration generated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error generating configuration:', error);

      if (error.message.includes('Template not found')) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      if (error.message.includes('Template is not active')) {
        return res.status(409).json({
          success: false,
          message: 'Template is not active',
          error: 'TEMPLATE_INACTIVE'
        });
      }

      if (error.message.includes('validation failed')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: 'VALIDATION_FAILED'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate configuration',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Apply template to devices
   */
  async applyTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { device_ids, variables = {} } = req.body;

      const result = await configTemplateService.applyTemplateToDevices(id, device_ids, variables);

      res.json({
        success: true,
        message: `Template applied to ${result.successful} out of ${result.total_devices} devices`,
        data: result
      });
    } catch (error) {
      console.error('Error applying template:', error);

      if (error.message.includes('Template not found')) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to apply template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Clone template
   */
  async cloneTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name, version } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'New template name is required',
          error: 'NAME_REQUIRED'
        });
      }

      const clonedTemplate = await configTemplateService.cloneTemplate(id, name, version);

      res.status(201).json({
        success: true,
        message: 'Template cloned successfully',
        data: clonedTemplate
      });
    } catch (error) {
      console.error('Error cloning template:', error);

      if (error.message.includes('Template not found')) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to clone template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Validate template
   */
  async validateTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await configTemplateService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
          error: 'TEMPLATE_NOT_FOUND'
        });
      }

      const validation = await configTemplateService.validateTemplate(template);

      res.json({
        success: validation.valid,
        message: validation.valid ? 'Template is valid' : 'Template validation failed',
        data: {
          valid: validation.valid,
          errors: validation.errors
        }
      });
    } catch (error) {
      console.error('Error validating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate template',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateUsage(req, res) {
    try {
      const templateId = req.query.template_id || null;
      const usage = await configTemplateService.getTemplateUsage(templateId);

      res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      console.error('Error fetching template usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template usage statistics',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new TemplateController();
const db = require('../config/database');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

class ConfigTemplateService {
  constructor() {
    this.tableName = 'configuration_templates';
  }

  /**
   * Create a new configuration template
   */
  async createTemplate(templateData) {
    // Validate template schema
    this.validateTemplateSchema(templateData.template, templateData.schema);

    const template = {
      id: uuidv4(),
      name: templateData.name,
      description: templateData.description,
      version: templateData.version || '1.0.0',
      template: templateData.template,
      schema: templateData.schema,
      device_type: templateData.device_type,
      is_default: templateData.is_default || false,
      active: templateData.active !== false,
      created_at: new Date(),
      updated_at: new Date()
    };

    // If setting as default, unset other defaults for same device type
    if (template.is_default) {
      await this.unsetDefaultTemplates(template.device_type);
    }

    const [createdTemplate] = await db(this.tableName)
      .insert(template)
      .returning('*');

    return createdTemplate;
  }

  /**
   * Get all templates with optional filtering
   */
  async getTemplates(filters = {}) {
    let query = db(this.tableName).select('*');

    if (filters.device_type) {
      query = query.where('device_type', filters.device_type);
    }

    if (filters.active !== undefined) {
      query = query.where('active', filters.active);
    }

    if (filters.is_default !== undefined) {
      query = query.where('is_default', filters.is_default);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
          .orWhere('description', 'ilike', `%${filters.search}%`);
      });
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
   * Get template by ID
   */
  async getTemplateById(id) {
    return await db(this.tableName)
      .where('id', id)
      .first();
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name) {
    return await db(this.tableName)
      .where('name', name)
      .first();
  }

  /**
   * Get default template for device type
   */
  async getDefaultTemplate(deviceType) {
    return await db(this.tableName)
      .where('device_type', deviceType)
      .where('is_default', true)
      .where('active', true)
      .first();
  }

  /**
   * Update template
   */
  async updateTemplate(id, updateData) {
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Validate template schema if provided
    if (updateData.template && updateData.schema) {
      this.validateTemplateSchema(updateData.template, updateData.schema);
    }

    const updated = {
      ...updateData,
      updated_at: new Date()
    };

    // If setting as default, unset other defaults for same device type
    if (updated.is_default && !template.is_default) {
      await this.unsetDefaultTemplates(template.device_type);
    }

    const [updatedTemplate] = await db(this.tableName)
      .where('id', id)
      .update(updated)
      .returning('*');

    return updatedTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id) {
    const template = await this.getTemplateById(id);
    if (!template) {
      return false;
    }

    // Don't allow deletion of default templates
    if (template.is_default) {
      throw new Error('Cannot delete default template');
    }

    const deletedRows = await db(this.tableName)
      .where('id', id)
      .del();

    return deletedRows > 0;
  }

  /**
   * Generate configuration from template
   */
  async generateConfiguration(templateId, variables = {}) {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.active) {
      throw new Error('Template is not active');
    }

    // Validate variables against schema
    this.validateVariables(variables, template.schema);

    // Generate configuration by replacing variables
    const configuration = this.processTemplate(template.template, variables);

    return {
      template_id: templateId,
      template_name: template.name,
      template_version: template.version,
      generated_at: new Date(),
      variables_used: variables,
      configuration: configuration
    };
  }

  /**
   * Apply template to devices
   */
  async applyTemplateToDevices(templateId, deviceIds, variables = {}) {
    const deviceService = require('./deviceService');
    
    const configuration = await this.generateConfiguration(templateId, variables);
    
    const results = [];
    
    for (const deviceId of deviceIds) {
      try {
        const updatedDevice = await deviceService.updateDeviceConfiguration(
          deviceId, 
          configuration.configuration
        );
        
        results.push({
          device_id: deviceId,
          success: true,
          updated_device: updatedDevice
        });
      } catch (error) {
        results.push({
          device_id: deviceId,
          success: false,
          error: error.message
        });
      }
    }

    return {
      template: configuration,
      applied_to: results,
      total_devices: deviceIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Validate template schema against template
   */
  validateTemplateSchema(template, schema) {
    try {
      // Create Joi schema from template schema definition
      const joiSchema = this.createJoiSchema(schema);
      
      // Extract variables from template
      const variables = this.extractTemplateVariables(template);
      
      // Validate that all required variables are defined in schema
      const requiredVars = schema.required || [];
      const missingVars = requiredVars.filter(varName => !variables.includes(varName));
      
      if (missingVars.length > 0) {
        throw new Error(`Template missing required variables: ${missingVars.join(', ')}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }

  /**
   * Validate variables against schema
   */
  validateVariables(variables, schema) {
    try {
      const joiSchema = this.createJoiSchema(schema);
      const { error } = joiSchema.validate(variables);
      
      if (error) {
        throw new Error(`Variable validation failed: ${error.details[0].message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Variable validation failed: ${error.message}`);
    }
  }

  /**
   * Create Joi schema from template schema definition
   */
  createJoiSchema(schemaDefinition) {
    const joiSchema = {};

    for (const [varName, varSchema] of Object.entries(schemaDefinition.properties || {})) {
      let joi;

      switch (varSchema.type) {
        case 'string':
          joi = Joi.string();
          if (varSchema.minLength) joi = joi.min(varSchema.minLength);
          if (varSchema.maxLength) joi = joi.max(varSchema.maxLength);
          if (varSchema.pattern) joi = joi.pattern(new RegExp(varSchema.pattern));
          if (varSchema.enum) joi = joi.valid(...varSchema.enum);
          break;

        case 'number':
          joi = Joi.number();
          if (varSchema.minimum !== undefined) joi = joi.min(varSchema.minimum);
          if (varSchema.maximum !== undefined) joi = joi.max(varSchema.maximum);
          break;

        case 'integer':
          joi = Joi.number().integer();
          if (varSchema.minimum !== undefined) joi = joi.min(varSchema.minimum);
          if (varSchema.maximum !== undefined) joi = joi.max(varSchema.maximum);
          break;

        case 'boolean':
          joi = Joi.boolean();
          break;

        case 'array':
          joi = Joi.array();
          if (varSchema.minItems) joi = joi.min(varSchema.minItems);
          if (varSchema.maxItems) joi = joi.max(varSchema.maxItems);
          break;

        case 'object':
          joi = Joi.object();
          break;

        default:
          joi = Joi.any();
      }

      if (varSchema.default !== undefined) {
        joi = joi.default(varSchema.default);
      }

      joiSchema[varName] = joi;
    }

    // Handle required fields
    const required = schemaDefinition.required || [];
    const finalSchema = Joi.object(joiSchema);

    return required.length > 0 
      ? finalSchema.options({ presence: 'required' })
      : finalSchema;
  }

  /**
   * Extract variables from template
   */
  extractTemplateVariables(template) {
    const templateStr = JSON.stringify(template);
    const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const variables = new Set();
    
    let match;
    while ((match = variableRegex.exec(templateStr)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Process template by replacing variables
   */
  processTemplate(template, variables) {
    let processed = JSON.stringify(template);

    // Replace variables
    for (const [varName, varValue] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
      processed = processed.replace(regex, varValue);
    }

    // Check for unreplaced variables
    const unreplacedRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const unreplaced = [];
    let match;
    while ((match = unreplacedRegex.exec(processed)) !== null) {
      unreplaced.push(match[1]);
    }

    if (unreplaced.length > 0) {
      throw new Error(`Unreplaced variables in template: ${unreplaced.join(', ')}`);
    }

    return JSON.parse(processed);
  }

  /**
   * Unset default templates for device type
   */
  async unsetDefaultTemplates(deviceType) {
    await db(this.tableName)
      .where('device_type', deviceType)
      .update({ is_default: false });
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId, newName, newVersion = null) {
    const original = await this.getTemplateById(templateId);
    if (!original) {
      throw new Error('Template not found');
    }

    const cloned = {
      name: newName,
      description: `Cloned from ${original.name}`,
      version: newVersion || `${original.version}-clone`,
      template: original.template,
      schema: original.schema,
      device_type: original.device_type,
      is_default: false, // Clones are never default
      active: true
    };

    return await this.createTemplate(cloned);
  }

  /**
   * Get template usage statistics
   */
  async getTemplateUsage(templateId = null) {
    // This would typically join with device configurations
    // For now, return basic template statistics
    
    let query = db(this.tableName)
      .select('device_type')
      .count('* as count')
      .groupBy('device_type');

    if (templateId) {
      query = query.where('id', templateId);
    }

    const deviceTypeStats = await query;
    
    const totalTemplates = await db(this.tableName).count('id as total');
    const activeTemplates = await db(this.tableName).where('active', true).count('id as total');

    return {
      total_templates: parseInt(totalTemplates[0].total),
      active_templates: parseInt(activeTemplates[0].total),
      by_device_type: deviceTypeStats.map(stat => ({
        device_type: stat.device_type,
        count: parseInt(stat.count)
      }))
    };
  }

  /**
   * Validate template before creation/update
   */
  async validateTemplate(templateData) {
    const errors = [];

    // Check name uniqueness
    if (templateData.name) {
      const existing = await this.getTemplateByName(templateData.name);
      if (existing && existing.id !== templateData.id) {
        errors.push('Template name already exists');
      }
    }

    // Validate template structure
    try {
      this.validateTemplateSchema(templateData.template, templateData.schema);
    } catch (error) {
      errors.push(error.message);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = new ConfigTemplateService();
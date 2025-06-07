const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('webhooks').del();

  // Sample webhooks for different use cases
  const webhooks = [
    {
      id: uuidv4(),
      name: 'License Plate Alert System',
      url: 'https://api.example.com/webhooks/plate-alerts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer webhook-token-123'
      },
      event_type: 'plate_detected',
      active: true,
      secret: crypto.randomBytes(32).toString('hex'),
      timeout_ms: 30000,
      retry_attempts: 3,
      retry_delay_ms: 5000,
      filter_conditions: {
        min_confidence: 0.8,
        site_codes: ['DT-MAIN', 'NP-001']
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Device Status Monitor',
      url: 'https://monitoring.carwash.com/webhooks/device-status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'monitor-api-key-456'
      },
      event_type: 'device_status_changed',
      active: true,
      secret: crypto.randomBytes(32).toString('hex'),
      timeout_ms: 15000,
      retry_attempts: 5,
      retry_delay_ms: 3000,
      filter_conditions: {},
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Security Alert Webhook',
      url: 'https://security.carwash.com/api/alerts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Token': 'security-token-789'
      },
      event_type: 'plate_detected',
      active: true,
      secret: crypto.randomBytes(32).toString('hex'),
      timeout_ms: 10000,
      retry_attempts: 2,
      retry_delay_ms: 10000,
      filter_conditions: {
        plate_regex: '^(WANTED|STOLEN|ALERT)',
        min_confidence: 0.9
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Analytics Data Collector',
      url: 'https://analytics.carwash.com/data/plates',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      event_type: 'plate_detected',
      active: false,
      secret: crypto.randomBytes(32).toString('hex'),
      timeout_ms: 45000,
      retry_attempts: 1,
      retry_delay_ms: 60000,
      filter_conditions: {
        site_codes: ['DT-MAIN', 'NP-001', 'SB-001', 'WM-001']
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Customer Notification System',
      url: 'https://notifications.carwash.com/webhooks/customer-alerts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer customer-notify-token'
      },
      event_type: 'plate_detected',
      active: true,
      secret: crypto.randomBytes(32).toString('hex'),
      timeout_ms: 20000,
      retry_attempts: 3,
      retry_delay_ms: 5000,
      filter_conditions: {
        min_confidence: 0.7,
        device_ids: ['CAM-MAIN-001', 'CAM-EXIT-001']
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Insert sample webhooks
  await knex('webhooks').insert(webhooks);
  
  console.log(`Seeded ${webhooks.length} sample webhooks`);
};
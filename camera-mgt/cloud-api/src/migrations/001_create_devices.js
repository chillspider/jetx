exports.up = function(knex) {
  return knex.schema.createTable('devices', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('device_id', 50).unique().notNullable().index();
    table.string('name', 100).notNullable();
    table.string('location', 255).notNullable();
    table.string('site_code', 20).notNullable().index();
    table.string('ip_address', 45).notNullable();
    table.integer('port').notNullable().defaultTo(3000);
    table.string('rtsp_url', 500).notNullable();
    table.string('api_key', 64).notNullable().unique();
    table.string('status', 20).notNullable().defaultTo('offline').index();
    table.timestamp('last_seen').nullable();
    table.jsonb('capabilities').defaultTo('{}');
    table.jsonb('configuration').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.string('firmware_version', 20).nullable();
    table.string('model', 50).nullable();
    table.string('serial_number', 100).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['site_code', 'status']);
    table.index(['status', 'last_seen']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('devices');
};

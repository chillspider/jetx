exports.up = function(knex) {
  return knex.schema.createTable('webhook_deliveries', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('webhook_id').notNullable().references('id').inTable('webhooks').onDelete('CASCADE');
    table.uuid('plate_recognition_id').nullable().references('id').inTable('plate_recognitions').onDelete('CASCADE');
    table.string('event_type', 50).notNullable().index();
    table.string('status', 20).notNullable().defaultTo('pending').index();
    table.integer('attempts').defaultTo(0);
    table.integer('response_code').nullable();
    table.text('response_body').nullable();
    table.text('error_message').nullable();
    table.jsonb('payload').notNullable();
    table.timestamp('scheduled_at').notNullable().defaultTo(knex.fn.now()).index();
    table.timestamp('delivered_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['webhook_id', 'created_at']);
    table.index(['status', 'scheduled_at']);
    table.index(['event_type', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('webhook_deliveries');
};

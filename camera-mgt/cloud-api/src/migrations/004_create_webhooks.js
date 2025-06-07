exports.up = function(knex) {
  return knex.schema.createTable('webhooks', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('url', 500).notNullable();
    table.string('method', 10).notNullable().defaultTo('POST');
    table.jsonb('headers').defaultTo('{}');
    table.string('event_type', 50).notNullable().index();
    table.boolean('active').notNullable().defaultTo(true).index();
    table.string('secret', 64).nullable();
    table.integer('timeout_ms').defaultTo(30000);
    table.integer('retry_attempts').defaultTo(3);
    table.integer('retry_delay_ms').defaultTo(5000);
    table.jsonb('filter_conditions').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['event_type', 'active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('webhooks');
};

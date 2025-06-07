exports.up = function(knex) {
  return knex.schema.createTable('device_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('device_id').notNullable().references('id').inTable('devices').onDelete('CASCADE');
    table.string('level', 10).notNullable().index();
    table.string('category', 50).notNullable().index();
    table.text('message').notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.string('source', 100).nullable();
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now()).index();
    
    // Composite indexes for efficient querying
    table.index(['device_id', 'timestamp']);
    table.index(['device_id', 'level', 'timestamp']);
    table.index(['category', 'timestamp']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('device_logs');
};

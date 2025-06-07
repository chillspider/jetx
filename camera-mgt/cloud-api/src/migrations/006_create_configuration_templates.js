exports.up = function(knex) {
  return knex.schema.createTable('configuration_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.text('description').nullable();
    table.string('version', 20).notNullable().defaultTo('1.0.0');
    table.jsonb('template').notNullable();
    table.jsonb('schema').notNullable();
    table.string('device_type', 50).notNullable().index();
    table.boolean('is_default').defaultTo(false).index();
    table.boolean('active').defaultTo(true).index();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['device_type', 'active']);
    table.index(['is_default', 'device_type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('configuration_templates');
};

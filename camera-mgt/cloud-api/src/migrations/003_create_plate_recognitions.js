exports.up = function(knex) {
  return knex.schema.createTable('plate_recognitions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('device_id').notNullable().references('id').inTable('devices').onDelete('CASCADE');
    table.string('plate_number', 20).notNullable().index();
    table.decimal('confidence', 5, 4).notNullable();
    table.string('region', 10).nullable();
    table.string('vehicle_type', 50).nullable();
    table.jsonb('bounding_box').nullable();
    table.jsonb('candidates').defaultTo('[]');
    table.string('image_path', 500).nullable();
    table.string('thumbnail_path', 500).nullable();
    table.jsonb('platerecognizer_response').defaultTo('{}');
    table.string('processing_time_ms', 10).nullable();
    table.string('webhook_status', 20).defaultTo('pending').index();
    table.timestamp('webhook_sent_at').nullable();
    table.timestamp('recognized_at').notNullable().defaultTo(knex.fn.now()).index();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['device_id', 'recognized_at']);
    table.index(['plate_number', 'recognized_at']);
    table.index(['device_id', 'plate_number']);
    table.index(['webhook_status', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('plate_recognitions');
};

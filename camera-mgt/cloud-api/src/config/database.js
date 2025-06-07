const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

if (!config) {
  throw new Error(`No database configuration found for environment: ${environment}`);
}

const db = knex(config);

// Test connection and log status
db.raw('SELECT 1')
  .then(() => {
    console.log(`✓ Database connected successfully (${environment})`);
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.destroy()
    .then(() => {
      console.log('Database connection closed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error closing database connection:', err);
      process.exit(1);
    });
});

module.exports = db;
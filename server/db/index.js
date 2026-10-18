const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not defined in server/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client in PostgreSQL pool', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

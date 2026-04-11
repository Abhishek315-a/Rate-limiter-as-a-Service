const { Pool } = require('pg');

let pool;

async function connectDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');

  await runMigrations();
}

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      key_hash VARCHAR(255) UNIQUE NOT NULL,
      key_prefix VARCHAR(10) NOT NULL,
      name VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      limit_count INTEGER NOT NULL,
      window_seconds INTEGER NOT NULL,
      algorithm VARCHAR(50) DEFAULT 'token_bucket',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS request_logs (
      id BIGSERIAL PRIMARY KEY,
      api_key_prefix VARCHAR(10),
      identifier VARCHAR(255),
      resource VARCHAR(255),
      allowed BOOLEAN,
      remaining INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_request_logs_api_key ON request_logs(api_key_prefix);
    CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
  `);

  console.log('Migrations complete');
}

function getDB() {
  if (!pool) throw new Error('Database not initialized');
  return pool;
}

module.exports = { connectDB, getDB };

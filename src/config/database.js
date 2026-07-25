const { Pool } = require('pg');

let pool;
let cleanupTimer;

async function connectDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,              // max pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });

  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');

  await runMigrations();

  // Schedule request_log cleanup every 24 hours
  scheduleLogCleanup();
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

async function cleanupOldLogs() {
  try {
    const result = await pool.query(
      `DELETE FROM request_logs WHERE created_at < NOW() - INTERVAL '7 days'`
    );
    const deleted = result.rowCount;
    if (deleted > 0) {
      console.log(`Log cleanup: removed ${deleted} old request_log rows`);
    }
  } catch (err) {
    console.error('Log cleanup error:', err.message);
  }
}

function scheduleLogCleanup() {
  // Run immediately once, then every 24 hours
  cleanupOldLogs();
  cleanupTimer = setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
  cleanupTimer.unref(); // Don't keep the process alive just for this
}

function getDB() {
  if (!pool) throw new Error('Database not initialized');
  return pool;
}

async function closeDB() {
  if (cleanupTimer) clearInterval(cleanupTimer);
  if (pool) await pool.end();
}

module.exports = { connectDB, getDB, closeDB };

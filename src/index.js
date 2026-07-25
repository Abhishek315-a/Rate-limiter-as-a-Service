require('dotenv').config();
const app = require('./app');
const { connectRedis, getRedis } = require('./config/redis');
const { connectDB, closeDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

let server;

async function start() {
  await connectRedis();
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`RLaaS running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

// ─── Graceful shutdown (required for Render SIGTERM on redeploy) ──────────
async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => console.log('HTTP server closed'));
  }

  try {
    const redis = getRedis();
    redis.disconnect();
    console.log('Redis disconnected');
  } catch (_) {}

  try {
    await closeDB();
    console.log('PostgreSQL pool closed');
  } catch (_) {}

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

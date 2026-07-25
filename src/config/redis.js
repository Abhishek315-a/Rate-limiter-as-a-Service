const Redis = require('ioredis');

let redis;

async function connectRedis() {
  const MAX_RETRY_DELAY_MS = 2000;
  const MAX_RETRIES = 10;

  const retryStrategy = (times) => {
    if (times > MAX_RETRIES) {
      console.error(`Redis: max reconnect attempts (${MAX_RETRIES}) reached. Giving up.`);
      return null; // stop retrying
    }
    return Math.min(times * 100, MAX_RETRY_DELAY_MS);
  };

  if (process.env.REDIS_URL) {
    // Upstash and other TLS-enabled providers use rediss:// scheme
    const isTLS = process.env.REDIS_URL.startsWith('rediss://');

    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy,
      maxRetriesPerRequest: 3,
      ...(isTLS && { tls: {} }),
    });
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy,
      maxRetriesPerRequest: 3,
    });
  }

  redis.on('connect', () => console.log('Redis connected'));
  redis.on('ready', () => console.log('Redis ready'));
  redis.on('error', (err) => console.error('Redis error:', err.message));
  redis.on('reconnecting', (ms) => console.warn(`Redis reconnecting in ${ms}ms...`));

  await redis.ping();
}

function getRedis() {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}

module.exports = { connectRedis, getRedis };

const Redis = require('ioredis');

let redis;

async function connectRedis() {
  const retryStrategy = (times) => Math.min(times * 50, 2000);

  redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { retryStrategy })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy,
      });

  redis.on('connect', () => console.log('Redis connected'));
  redis.on('error', (err) => console.error('Redis error:', err));

  await redis.ping();
}

function getRedis() {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}

module.exports = { connectRedis, getRedis };

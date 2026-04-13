const { getRedis } = require('../config/redis');

/*
  Sliding Window Algorithm
  ------------------------
  - Uses a Redis Sorted Set where score = request timestamp (ms)
  - On each request:
    1. Remove all entries older than (now - windowMs)   ← expired
    2. Count remaining entries
    3. If count < limit → allow, add entry
    4. If count >= limit → block

  Difference from Token Bucket:
  - Token Bucket: smooth continuous refill, allows short bursts
  - Sliding Window: strict count over a rolling window, no burst allowed
    e.g. 5 req/min → can never exceed 5 in ANY 60-second window

  Lua script ensures atomicity (no race conditions)
*/

const SLIDING_WINDOW_SCRIPT = `
  local key      = KEYS[1]
  local limit    = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local now      = tonumber(ARGV[3])
  local reqId    = ARGV[4]

  local cutoff = now - windowMs

  redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)

  local count = redis.call('ZCARD', key)

  local allowed   = 0
  local remaining = math.max(0, limit - count)

  if count < limit then
    redis.call('ZADD', key, now, reqId)
    allowed   = 1
    remaining = remaining - 1
  end

  local ttlSec = math.ceil(windowMs / 1000) + 1
  redis.call('EXPIRE', key, ttlSec)

  return { allowed, math.max(0, remaining) }
`;

async function slidingWindow({ key, limit, windowSeconds }) {
  const redis = getRedis();
  const now = Date.now();
  const reqId = `${now}-${Math.random().toString(36).substr(2, 9)}`;

  const result = await redis.eval(
    SLIDING_WINDOW_SCRIPT,
    1,
    key,
    limit,
    windowSeconds * 1000,
    now,
    reqId
  );

  const allowed = result[0] === 1;
  const remaining = result[1];
  const resetAt = new Date(Date.now() + windowSeconds * 1000).toISOString();

  return { allowed, remaining, limit, resetAt };
}

module.exports = { slidingWindow };

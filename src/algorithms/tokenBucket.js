const { getRedis } = require('../config/redis');

/*
  Token Bucket Algorithm
  ----------------------
  - Bucket holds up to `limit` tokens
  - Tokens refill at rate of `limit / windowSeconds` per second
  - Each request consumes 1 token
  - If no tokens → request is blocked

  Lua script ensures atomicity:
  Read + Write happen as a single operation on Redis
  No race conditions possible
*/

const TOKEN_BUCKET_SCRIPT = `
  local key        = KEYS[1]
  local capacity   = tonumber(ARGV[1])
  local refillRate = tonumber(ARGV[2])
  local now        = tonumber(ARGV[3])

  local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')

  local tokens     = tonumber(bucket[1])
  local lastRefill = tonumber(bucket[2])

  if tokens == nil then
    tokens     = capacity
    lastRefill = now
  end

  local elapsed       = math.max(0, now - lastRefill)
  local tokensToAdd   = elapsed * refillRate
  tokens              = math.min(capacity, tokens + tokensToAdd)
  lastRefill          = now

  local allowed   = 0
  local remaining = math.floor(tokens)

  if tokens >= 1 then
    tokens  = tokens - 1
    allowed = 1
    remaining = math.floor(tokens)
  end

  local ttl = math.ceil(capacity / refillRate) + 1
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
  redis.call('EXPIRE', key, ttl)

  return { allowed, remaining }
`;

async function tokenBucket({ key, limit, windowSeconds }) {
  const redis = getRedis();
  const refillRate = limit / windowSeconds;
  const now = Date.now() / 1000;

  const result = await redis.eval(
    TOKEN_BUCKET_SCRIPT,
    1,
    key,
    limit,
    refillRate,
    now
  );

  const allowed = result[0] === 1;
  const remaining = result[1];

  const resetAt = new Date(
    (Date.now() + (windowSeconds * 1000))
  ).toISOString();

  return {
    allowed,
    remaining,
    limit,
    resetAt,
  };
}

module.exports = { tokenBucket };

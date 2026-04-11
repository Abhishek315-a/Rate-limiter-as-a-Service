const { runAlgorithm } = require('../algorithms');
const { getDB } = require('../config/database');

async function check(req, res, next) {
  const { identifier, resource = 'default', limit, window: windowStr, algorithm } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'identifier is required' });
  }

  if (!limit || !windowStr) {
    return res.status(400).json({ error: 'limit and window are required' });
  }

  const windowSeconds = parseWindow(windowStr);
  if (!windowSeconds) {
    return res.status(400).json({ error: 'Invalid window format. Use: 30s, 5m, 1h, 1d' });
  }

  const redisKey = `rlaas:${req.apiKey.key_prefix}:${identifier}:${resource}`;

  try {
    const result = await runAlgorithm({
      algorithm: algorithm || 'token_bucket',
      key: redisKey,
      limit: parseInt(limit),
      windowSeconds,
    });

    await logRequest({
      apiKeyPrefix: req.apiKey.key_prefix,
      identifier,
      resource,
      allowed: result.allowed,
      remaining: result.remaining,
    });

    const status = result.allowed ? 200 : 429;

    if (!result.allowed) {
      res.set('Retry-After', windowSeconds);
    }

    res.set('X-RateLimit-Limit', limit);
    res.set('X-RateLimit-Remaining', result.remaining);
    res.set('X-RateLimit-Reset', result.resetAt);

    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

async function logRequest({ apiKeyPrefix, identifier, resource, allowed, remaining }) {
  try {
    const db = getDB();
    await db.query(
      `INSERT INTO request_logs (api_key_prefix, identifier, resource, allowed, remaining)
       VALUES ($1, $2, $3, $4, $5)`,
      [apiKeyPrefix, identifier, resource, allowed, remaining]
    );
  } catch (err) {
    console.error('Failed to log request:', err.message);
  }
}

function parseWindow(windowStr) {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = windowStr.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  return parseInt(match[1]) * units[match[2]];
}

module.exports = { check };

const { getDB } = require('../config/database');

async function getSummary(req, res, next) {
  try {
    const db = getDB();

    const keysResult = await db.query(
      `SELECT key_prefix FROM api_keys WHERE user_id = $1 AND is_active = true`,
      [req.userId]
    );

    const prefixes = keysResult.rows.map((r) => r.key_prefix);

    if (prefixes.length === 0) {
      return res.json({ totalRequests: 0, blockedRequests: 0, allowedRequests: 0, blockRate: 0 });
    }

    const statsResult = await db.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE allowed = false) AS blocked,
         COUNT(*) FILTER (WHERE allowed = true) AS allowed
       FROM request_logs
       WHERE api_key_prefix = ANY($1)
         AND created_at >= NOW() - INTERVAL '24 hours'`,
      [prefixes]
    );

    const row = statsResult.rows[0];
    const total = parseInt(row.total);
    const blocked = parseInt(row.blocked);

    res.json({
      totalRequests: total,
      blockedRequests: blocked,
      allowedRequests: parseInt(row.allowed),
      blockRate: total > 0 ? ((blocked / total) * 100).toFixed(2) + '%' : '0%',
      window: 'last 24 hours',
    });
  } catch (err) {
    next(err);
  }
}

async function getByIdentifier(req, res, next) {
  const { identifier } = req.params;

  try {
    const db = getDB();

    const keysResult = await db.query(
      `SELECT key_prefix FROM api_keys WHERE user_id = $1 AND is_active = true`,
      [req.userId]
    );

    const prefixes = keysResult.rows.map((r) => r.key_prefix);

    const result = await db.query(
      `SELECT
         resource,
         COUNT(*) AS total_requests,
         COUNT(*) FILTER (WHERE allowed = false) AS blocked,
         MAX(created_at) AS last_seen
       FROM request_logs
       WHERE identifier = $1
         AND api_key_prefix = ANY($2)
       GROUP BY resource
       ORDER BY total_requests DESC`,
      [identifier, prefixes]
    );

    res.json({ identifier, resources: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getTimeSeries(req, res, next) {
  try {
    const db = getDB();

    const keysResult = await db.query(
      `SELECT key_prefix FROM api_keys WHERE user_id = $1 AND is_active = true`,
      [req.userId]
    );

    const prefixes = keysResult.rows.map((r) => r.key_prefix);

    if (prefixes.length === 0) {
      return res.json({ data: [] });
    }

    const result = await db.query(
      `SELECT
         date_trunc('hour', created_at) AS hour,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE allowed = false) AS blocked,
         COUNT(*) FILTER (WHERE allowed = true) AS allowed
       FROM request_logs
       WHERE api_key_prefix = ANY($1)
         AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY hour
       ORDER BY hour ASC`,
      [prefixes]
    );

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getKeyUsage(req, res, next) {
  try {
    const db = getDB();
    const result = await db.query(
      `SELECT
         ak.id, ak.key_prefix, ak.name, ak.is_active,
         COUNT(rl.id)                                        AS total_requests,
         COUNT(rl.id) FILTER (WHERE rl.allowed = false)     AS blocked_requests
       FROM api_keys ak
       LEFT JOIN request_logs rl
         ON rl.api_key_prefix = ak.key_prefix
        AND rl.created_at >= NOW() - INTERVAL '24 hours'
       WHERE ak.user_id = $1
       GROUP BY ak.id, ak.key_prefix, ak.name, ak.is_active
       ORDER BY total_requests DESC`,
      [req.userId]
    );
    res.json({ keys: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getByIdentifier, getTimeSeries, getKeyUsage };

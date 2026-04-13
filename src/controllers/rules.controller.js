const { getDB } = require('../config/database');

async function list(req, res, next) {
  try {
    const db = getDB();
    const result = await db.query(
      `SELECT id, name, limit_count, window_seconds, algorithm, created_at, updated_at
       FROM rules WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json({ rules: result.rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const { name, limit, window: windowStr, algorithm = 'token_bucket' } = req.body;

  if (!name || !limit || !windowStr) {
    return res.status(400).json({ error: 'name, limit, and window are required' });
  }

  const windowSeconds = parseWindow(windowStr);
  if (!windowSeconds) {
    return res.status(400).json({ error: 'Invalid window format. Use: 30s, 5m, 1h, 1d' });
  }

  const VALID_ALGORITHMS = ['token_bucket', 'sliding_window'];
  if (!VALID_ALGORITHMS.includes(algorithm)) {
    return res.status(400).json({ error: `Invalid algorithm. Valid: ${VALID_ALGORITHMS.join(', ')}` });
  }

  try {
    const db = getDB();
    const result = await db.query(
      `INSERT INTO rules (user_id, name, limit_count, window_seconds, algorithm)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, limit_count, window_seconds, algorithm, created_at`,
      [req.userId, name, limit, windowSeconds, algorithm]
    );
    res.status(201).json({ rule: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  const { ruleId } = req.params;
  const { name, limit, window: windowStr, algorithm } = req.body;

  const windowSeconds = windowStr ? parseWindow(windowStr) : undefined;

  try {
    const db = getDB();
    const result = await db.query(
      `UPDATE rules
       SET name = COALESCE($1, name),
           limit_count = COALESCE($2, limit_count),
           window_seconds = COALESCE($3, window_seconds),
           algorithm = COALESCE($4, algorithm),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING id, name, limit_count, window_seconds, algorithm, updated_at`,
      [name, limit, windowSeconds, algorithm, ruleId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ rule: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  const { ruleId } = req.params;

  try {
    const db = getDB();
    const result = await db.query(
      `DELETE FROM rules WHERE id = $1 AND user_id = $2 RETURNING id`,
      [ruleId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
}

function parseWindow(windowStr) {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = windowStr.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  return parseInt(match[1]) * units[match[2]];
}

module.exports = { list, create, update, remove };

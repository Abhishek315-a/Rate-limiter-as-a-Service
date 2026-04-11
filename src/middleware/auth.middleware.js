const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

async function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  const prefix = apiKey.substring(0, 8);

  try {
    const db = getDB();
    const result = await db.query(
      `SELECT ak.*, u.id as user_id
       FROM api_keys ak
       JOIN users u ON u.id = ak.user_id
       WHERE ak.key_prefix = $1 AND ak.is_active = true`,
      [prefix]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyRecord = result.rows[0];
    const isValid = await bcrypt.compare(apiKey, keyRecord.key_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    await db.query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [keyRecord.id]
    );

    req.apiKey = keyRecord;
    req.userId = keyRecord.user_id;
    next();
  } catch (err) {
    next(err);
  }
}

async function requireJWT(req, res, next) {
  const jwt = require('jsonwebtoken');
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireApiKey, requireJWT };

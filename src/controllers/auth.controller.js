const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

async function register(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const db = getDB();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    next(err);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const db = getDB();
    const result = await db.query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    next(err);
  }
}

async function createApiKey(req, res, next) {
  const { name } = req.body;

  try {
    const db = getDB();

    const rawKey = `rlaas_${uuidv4().replace(/-/g, '')}`;
    const prefix = rawKey.substring(0, 8);
    const keyHash = await bcrypt.hash(rawKey, 10);

    await db.query(
      `INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4)`,
      [req.userId, keyHash, prefix, name || 'Default']
    );

    res.status(201).json({
      apiKey: rawKey,
      prefix,
      name: name || 'Default',
      note: 'Store this key safely. It will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

async function listApiKeys(req, res, next) {
  try {
    const db = getDB();
    const result = await db.query(
      `SELECT id, key_prefix, name, created_at, last_used_at, is_active
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json({ keys: result.rows });
  } catch (err) {
    next(err);
  }
}

async function revokeApiKey(req, res, next) {
  const { keyId } = req.params;

  try {
    const db = getDB();
    const result = await db.query(
      `UPDATE api_keys SET is_active = false
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [keyId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key revoked' });
  } catch (err) {
    next(err);
  }
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { register, login, createApiKey, listApiKeys, revokeApiKey };

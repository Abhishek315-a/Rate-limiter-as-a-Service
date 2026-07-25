const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');
const { getRedis } = require('../config/redis');
const { CACHE_PREFIX } = require('../middleware/auth.middleware');

// ─── Validation helpers ───────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

// ─── Controllers ──────────────────────────────────────────────────────────
async function register(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (!validatePassword(password)) {
    return res
      .status(400)
      .json({ error: 'Password must be between 8 and 128 characters' });
  }

  try {
    const db = getDB();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email.toLowerCase().trim(), passwordHash]
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

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  try {
    const db = getDB();
    const result = await db.query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    // Constant-time response whether or not the email exists (prevents enumeration)
    const user = result.rows[0];
    const dummyHash = '$2a$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const isValid = user ? await bcrypt.compare(password, user.password_hash) : await bcrypt.compare(password, dummyHash);

    if (!user || !isValid) {
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

  if (name && (typeof name !== 'string' || name.length > 100)) {
    return res.status(400).json({ error: 'Key name must be a string of up to 100 characters' });
  }

  try {
    const db = getDB();

    const rawKey = `rlaas_${uuidv4().replace(/-/g, '')}`;
    const prefix = rawKey.substring(0, 8);
    const keyHash = await bcrypt.hash(rawKey, 10);

    await db.query(
      `INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4)`,
      [req.userId, keyHash, prefix, name ? name.trim() : 'Default']
    );

    res.status(201).json({
      apiKey: rawKey,
      prefix,
      name: name ? name.trim() : 'Default',
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
       WHERE id = $1 AND user_id = $2 RETURNING id, key_prefix`,
      [keyId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Immediately invalidate the auth cache for this key
    try {
      const redis = getRedis();
      await redis.del(`${CACHE_PREFIX}${result.rows[0].key_prefix}`);
    } catch (cacheErr) {
      // Non-fatal — the cache will expire naturally after 60s
      console.error('Failed to invalidate auth cache on revoke:', cacheErr.message);
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

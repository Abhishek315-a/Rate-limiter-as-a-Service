const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const authRoutes = require('./routes/auth.routes');
const rulesRoutes = require('./routes/rules.routes');
const checkRoutes = require('./routes/check.routes');
const statsRoutes = require('./routes/stats.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ─── Security headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // allow Vercel frontend to embed
  })
);

// ─── CORS ──────────────────────────────────────────────────────────────────
const normalizeOrigin = (value) => {
  if (!value) return value;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const allowedOrigin = normalizeOrigin(process.env.CLIENT_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!allowedOrigin) return callback(null, true);
      if (!origin) return callback(null, true); // allow server-to-server / curl

      const normalizedOrigin = normalizeOrigin(origin);
      if (normalizedOrigin === allowedOrigin) return callback(null, true);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ─── Request ID (useful for tracing in Render logs) ───────────────────────
app.use((req, res, next) => {
  req.id = uuidv4();
  res.set('X-Request-ID', req.id);
  next();
});

// ─── Logging ──────────────────────────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ─── Body parsing — cap at 10kb to prevent JSON payload DoS ───────────────
app.use(express.json({ limit: '10kb' }));

// ─── Brute-force protection for auth endpoints ────────────────────────────
// Simple in-memory sliding window: max 10 attempts per IP per 15 minutes.
// No extra dependency needed — resets on server restart, which is fine for
// the free tier single-instance setup.
const authAttempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 10;

function authRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!authAttempts.has(ip)) {
    authAttempts.set(ip, []);
  }

  // Remove attempts outside the window
  const attempts = authAttempts.get(ip).filter((t) => now - t < AUTH_WINDOW_MS);
  attempts.push(now);
  authAttempts.set(ip, attempts);

  if (attempts.length > AUTH_MAX_ATTEMPTS) {
    return res.status(429).json({
      error: `Too many attempts. Try again in ${AUTH_WINDOW_MS / 60000} minutes.`,
    });
  }

  next();
}

// Periodically clean up the Map to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of authAttempts.entries()) {
    const fresh = times.filter((t) => now - t < AUTH_WINDOW_MS);
    if (fresh.length === 0) {
      authAttempts.delete(ip);
    } else {
      authAttempts.set(ip, fresh);
    }
  }
}, AUTH_WINDOW_MS).unref();

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/rules', rulesRoutes);
app.use('/api/v1/check', checkRoutes);
app.use('/api/v1/stats', statsRoutes);

// ─── Error handler ────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

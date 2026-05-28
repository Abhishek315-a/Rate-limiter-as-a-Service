const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const rulesRoutes = require('./routes/rules.routes');
const checkRoutes = require('./routes/check.routes');
const statsRoutes = require('./routes/stats.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());

const normalizeOrigin = (value) => {
  if (!value) return value;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const allowedOrigin = normalizeOrigin(process.env.CLIENT_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!allowedOrigin) return callback(null, true);
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      if (normalizedOrigin === allowedOrigin) return callback(null, true);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rules', rulesRoutes);
app.use('/api/v1/check', checkRoutes);
app.use('/api/v1/stats', statsRoutes);

app.use(errorHandler);

module.exports = app;

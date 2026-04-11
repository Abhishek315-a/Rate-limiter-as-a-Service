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
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rules', rulesRoutes);
app.use('/api/v1/check', checkRoutes);
app.use('/api/v1/stats', statsRoutes);

app.use(errorHandler);

module.exports = app;

function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  // Always log the full error server-side
  console.error(`[${req.id || '-'}] ${err.stack || err.message}`);

  const status = err.status || 500;

  // Never expose stack traces or internal messages to clients in production
  const message =
    isProd && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };

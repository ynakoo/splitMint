// ─────────────────────────────────────────────────────────
// Global Error Handler Middleware
// ─────────────────────────────────────────────────────────

function notFound(req, res, _next) {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
}

function errorHandler(err, _req, res, _next) {
  console.error('❌ Error:', err.message);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };

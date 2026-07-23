/**
 * Global error handler middleware.
 * Chuẩn hóa mọi lỗi thành JSON response.
 */
function errorHandler(err, req, res, _next) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  // Multer file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
  }

  // Joi validation error
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details.map(d => d.message),
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;

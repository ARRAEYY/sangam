const { reportError } = require('../utils/monitoring')

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const isServerError = status >= 500

  if (isServerError) {
    // Structured log + optional external monitoring (guarded by NODE_ENV/ERROR_WEBHOOK_URL)
    reportError(err, {
      source: 'request',
      method: req.method,
      path: req.originalUrl,
      status,
    })
  }

  // Only expose custom error messages for 4xx client errors; sanitize 5xx server errors
  const detail = isServerError
    ? 'Internal server error. Please try again later.'
    : err.message || 'Something went wrong.'

  res.status(status).json({ detail })
}

module.exports = errorHandler

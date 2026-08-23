function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const isServerError = status >= 500

  if (isServerError) {
    console.error(err)
  }

  // Temporarily expose full error detail to diagnose production 500s
  const detail = err.message || 'Something went wrong.'

  res.status(status).json({ detail })
}

module.exports = errorHandler

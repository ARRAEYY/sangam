function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const isServerError = status >= 500

  if (isServerError) {
    // Full detail (stack, driver-level messages like Postgres auth
    // failures, etc.) is only ever logged server-side, never sent to the
    // client - see PHASE 17 in the project brief.
    console.error(err)
  }

  const detail = isServerError ? 'Something went wrong. Please try again.' : err.message || 'Something went wrong.'

  res.status(status).json({ detail })
}

module.exports = errorHandler

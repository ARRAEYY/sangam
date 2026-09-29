const logger = require('./logger')

// Lightweight error monitoring: every 5xx and process-level failure flows
// through reportError(), which logs a structured payload and (in production,
// when ERROR_WEBHOOK_URL is configured) forwards it to an external endpoint
// (Slack/Discord/custom ingest). No-op overhead when unconfigured and in
// dev/test, so suites are unaffected.

const ERROR_WEBHOOK_URL = process.env.ERROR_WEBHOOK_URL || ''
const MONITORING_ENABLED = process.env.NODE_ENV === 'production' && Boolean(ERROR_WEBHOOK_URL)

const RATE_WINDOW_MS = 60 * 1000
const MAX_REPORTS_PER_WINDOW = 20
let windowStart = 0
let reportsInWindow = 0

function fingerprint(err) {
  const message = (err && err.message) || 'unknown'
  const type = (err && err.name) || 'Error'
  // Collapse messages containing ids/uuids/hex so bursts map to one key
  const normalized = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
    .replace(/\b\d+\b/g, '<num>')
  return `${type}: ${normalized}`.slice(0, 200)
}

async function deliver(payload) {
  try {
    const res = await fetch(ERROR_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      logger.warn(`[MONITORING] Error webhook responded ${res.status}`)
    }
  } catch (err) {
    logger.warn(`[MONITORING] Failed to deliver error report: ${err.message}`)
  }
}

function reportError(err, context = {}) {
  const error = err instanceof Error ? err : new Error(String(err))
  const payload = {
    severity: context.severity || 'error',
    service: 'campus-api',
    env: process.env.NODE_ENV || 'development',
    type: error.name || 'Error',
    message: error.message,
    stack: error.stack,
    fingerprint: fingerprint(error),
    context,
    timestamp: new Date().toISOString(),
  }

  logger.error('[MONITORING] Unhandled error', {
    ...payload,
    stack: error.stack,
  })

  if (!MONITORING_ENABLED) {
    return
  }

  // Simple token bucket so a pathological loop can't flood the sink
  const now = Date.now()
  if (now - windowStart > RATE_WINDOW_MS) {
    windowStart = now
    reportsInWindow = 0
  }
  if (reportsInWindow >= MAX_REPORTS_PER_WINDOW) {
    return
  }
  reportsInWindow += 1

  deliver(payload)
}

/**
 * @param {object} [options]
 * @param {(err: Error) => void} [options.onFatal] Called on uncaughtException
 *   so the server can run its graceful shutdown before exit. Defaults to
 *   an immediate non-zero exit.
 */
function initProcessMonitoring({ onFatal } = {}) {
  process.on('unhandledRejection', (reason) => {
    reportError(reason, { source: 'unhandledRejection', severity: 'warning' })
  })

  process.on('uncaughtException', (err) => {
    reportError(err, { source: 'uncaughtException' })
    // State after an uncaught exception is not trustworthy — exit and let
    // the platform restart the process.
    if (onFatal) {
      onFatal(err)
    } else {
      process.exit(1)
    }
  })
}

module.exports = { reportError, initProcessMonitoring }

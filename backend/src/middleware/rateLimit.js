/**
 * In-memory sliding-window rate limiter.
 * No external dependencies — suitable for single-instance deployments.
 *
 * Usage:
 *   const { createLimiter } = require('./rateLimit')
 *   const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 5, keyGenerator: ... })
 *   router.post('/login', authLimiter, handler)
 */

class SlidingWindowStore {
  constructor() {
    this.hits = new Map()          // key → [timestamps]
    this.cleanupInterval = setInterval(() => this._cleanup(), 60_000)
    this.cleanupInterval.unref()   // don't prevent process exit
  }

  /** Record a hit and return { totalHits, resetTime } */
  increment(key, windowMs) {
    const now = Date.now()
    const windowStart = now - windowMs
    let timestamps = this.hits.get(key) || []

    // Keep only timestamps inside the current window
    timestamps = timestamps.filter((t) => t > windowStart)
    timestamps.push(now)
    this.hits.set(key, timestamps)

    return {
      totalHits: timestamps.length,
      resetTime: new Date(timestamps[0] + windowMs),
    }
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, timestamps] of this.hits) {
      // Remove entries older than 30 minutes (max window we use)
      const fresh = timestamps.filter((t) => now - t < 30 * 60 * 1000)
      if (fresh.length === 0) {
        this.hits.delete(key)
      } else {
        this.hits.set(key, fresh)
      }
    }
  }
}

const store = new SlidingWindowStore()

/**
 * Create an Express middleware that rate-limits requests.
 *
 * @param {Object} opts
 * @param {number} opts.windowMs  - Time window in milliseconds (default 15 min)
 * @param {number} opts.max       - Max requests per window (default 5)
 * @param {Function} opts.keyGenerator - (req) => string  (default: IP)
 * @param {string} opts.message   - Error message on limit hit
 */
function createLimiter({
  windowMs = 15 * 60 * 1000,
  max = 5,
  keyGenerator = (req) => req.ip,
  message = 'Too many requests — please try again later.',
} = {}) {
  return (req, res, next) => {
    const key = keyGenerator(req)
    const { totalHits, resetTime } = store.increment(key, windowMs)

    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - totalHits))
    res.setHeader('X-RateLimit-Reset', resetTime.toISOString())

    if (totalHits > max) {
      const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000)
      res.setHeader('Retry-After', retryAfterSeconds)
      return res.status(429).json({ detail: message })
    }

    next()
  }
}

// Pre-configured limiters with balanced, user-friendly thresholds ───

/** Auth endpoints: 5 attempts per 15 minutes per IP+email */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    return `auth:${req.ip}:${email}`
  },
  message: 'Too many auth attempts. Please try again in a few minutes.',
})

/** General API: 300 requests per minute per IP */
const generalLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req) => `general:${req.ip}`,
  message: 'Too many API requests — please slow down.',
})

module.exports = { createLimiter, authLimiter, generalLimiter }

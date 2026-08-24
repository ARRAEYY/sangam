const { User } = require('../models')
const { verifyToken } = require('../utils/auth')

async function requireAuth(req, res, next) {
  // 1. Prefer httpOnly cookie
  let token = req.cookies?.token

  // 2. Fall back to Authorization header (API / mobile clients)
  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim()
    }
  }

  if (!token) {
    return res.status(401).json({ detail: 'Authentication required.' })
  }

  try {
    const decoded = verifyToken(token)
    const user = await User.findByPk(decoded.sub)

    if (!user) {
      return res.status(401).json({ detail: 'Invalid token.' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid token.' })
  }
}

module.exports = {
  requireAuth,
}

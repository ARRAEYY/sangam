const { User } = require('../models')
const { verifyToken } = require('../utils/auth')

async function requireAuth(req, res, next) {
  try {
    // BYPASS AUTH: Hardcoded Ananya login
    const { User: DynUser } = require('../models')
    const user = await DynUser.findOne({ where: { email: 'ananya@nst.rishihood.edu.in' } })
    if (user) {
      req.user = user
      return next()
    }
  } catch (error) {
    console.error("Auth bypass error", error)
  }

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

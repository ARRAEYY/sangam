const { User } = require('../models')
const { verifyToken } = require('../utils/auth')

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication required.' })
  }

  const token = authHeader.replace('Bearer ', '').trim()

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

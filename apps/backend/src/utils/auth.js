const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// Single source of truth for the access-token lifetime, used by both the
// signer and the cookie setter (#50). Default 60 minutes; refresh rotation
// renews sessions silently.
const ACCESS_TOKEN_TTL_MINUTES = Number(process.env.JWT_EXPIRE_MINUTES || 60)

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'change_this') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set securely. System cannot start.')
  }
  return secret
}

function signToken(user) {
  const secret = getJwtSecret()
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    secret,
    { expiresIn: ACCESS_TOKEN_TTL_MINUTES * 60 }
  )
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex')
}

// Refresh tokens are stored as SHA-256 hashes so a database dump never
// yields usable sessions (#24). Same scheme as password-reset tokens.
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function verifyToken(token) {
  const secret = getJwtSecret()
  return jwt.verify(token, secret)
}

module.exports = {
  signToken,
  verifyToken,
  generateRefreshToken,
  hashToken,
  ACCESS_TOKEN_TTL_MINUTES,
}

const jwt = require('jsonwebtoken')
const crypto = require('crypto')

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'change_this') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set securely. System cannot start.')
  }
  return secret
}

function signToken(user) {
  const secret = getJwtSecret()
  // Default to 15 minutes for access tokens
  const expiresInMinutes = Number(process.env.JWT_EXPIRE_MINUTES || 15)

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    secret,
    { expiresIn: expiresInMinutes * 60 }
  )
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex')
}

function verifyToken(token) {
  const secret = getJwtSecret()
  return jwt.verify(token, secret)
}

module.exports = {
  signToken,
  verifyToken,
  generateRefreshToken,
}

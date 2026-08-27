const jwt = require('jsonwebtoken')

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'change_this') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set securely. System cannot start.')
  }
  return secret
}

function signToken(user) {
  const secret = getJwtSecret()
  const expiresInMinutes = Number(process.env.JWT_EXPIRE_MINUTES || 10080)

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    secret,
    { expiresIn: expiresInMinutes * 60 }
  )
}

function verifyToken(token) {
  const secret = getJwtSecret()
  return jwt.verify(token, secret)
}

module.exports = {
  signToken,
  verifyToken,
}

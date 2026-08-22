const jwt = require('jsonwebtoken')

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'change_this'
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
  const secret = process.env.JWT_SECRET || 'change_this'
  return jwt.verify(token, secret)
}

module.exports = {
  signToken,
  verifyToken,
}

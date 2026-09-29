const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { Sequelize, Op } = require('sequelize')
const { sequelize, User, Skill, RefreshToken } = require('../../models')
const { signToken, generateRefreshToken, hashToken, ACCESS_TOKEN_TTL_MINUTES } = require('../../utils/auth')
const { serializeUser } = require('../../utils/serializers')
const { validatePassword } = require('../../utils/passwordPolicy')
const { isValidHttpUrl } = require('../../utils/urlValidation')
const { authLimiter } = require('../../middleware/rateLimit')
const { requireAuth } = require('../../middleware/auth')
const { sendPasswordResetEmail, sendVerificationEmail } = require('../../utils/mailer')
const { normalizeCourse, isValidCourse, VALID_COURSES } = require('../../utils/courses')
const { logAudit } = require('../../utils/auditLogger')

const router = express.Router()

const TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_TTL_MINUTES

// Frontend origin used for links embedded in emails — never derive links from
// the request Host header (#28).
function getFrontendUrl() {
  return process.env.CORS_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5173'
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeSkillName(value) {
  return String(value || '').trim()
}

function isCampusEmail(email) {
  const domain = String(email || '').trim().toLowerCase().split('@')[1]
  if (!domain) return false
  // Allows any department under Rishihood (e.g. name.enroll@depart.rishihood.edu.in or you@rishihood.edu.in)
  return domain === 'rishihood.edu.in' || domain.endsWith('.rishihood.edu.in')
}

async function assignSkills(user, skills = [], options = {}) {
  const names = [...new Set((skills || []).map(normalizeSkillName).filter(Boolean))]

  const skillRecords = await Promise.all(
    names.map(async (name) => {
      const record = await Skill.findOne({
        where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), name.toLowerCase()),
        ...options,
      })
      if (record) return record
      return Skill.create({ name }, options)
    })
  )

  await user.setSkills(skillRecords, options)
}

/** Helper: set the auth cookies on the response */
function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
  }

  // Access token cookie (short lived)
  res.cookie('token', accessToken, {
    ...cookieOptions,
    maxAge: TOKEN_EXPIRE_MINUTES * 60 * 1000,
  })

  // Refresh token cookie (long lived - 7 days)
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }
}

// ─── Register ────────────────────────────────────────────────

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const payload = req.body || {}
    const email = normalizeEmail(payload.email)
    const password = String(payload.password || '').trim()
    const fullName = String(payload.full_name || '').trim()
    const branch = String(payload.branch || '').trim()
    const graduationYear = Number(payload.graduation_year)
    const githubUrl = String(payload.github_url || '').trim()
    const skills = Array.isArray(payload.skills) ? payload.skills : []

    if (!fullName) {
      return res.status(400).json({ detail: 'Full name is required.' })
    }
    if (!email || !isCampusEmail(email)) {
      return res
        .status(400)
        .json({ detail: 'Only Rishihood email addresses (e.g. you@depart.rishihood.edu.in or you@rishihood.edu.in) are allowed.' })
    }

    // Password strength validation
    const pwResult = validatePassword(password)
    if (!pwResult.valid) {
      return res.status(400).json({ detail: pwResult.errors.join(' ') })
    }

    if (!branch) {
      return res.status(400).json({ detail: 'Course / branch is required.' })
    }
    const normalizedBranch = normalizeCourse(branch)
    if (!normalizedBranch) {
      return res.status(400).json({
        detail: `Invalid course. Must be one of: ${VALID_COURSES.join(', ')}.`,
      })
    }
    if (!Number.isInteger(graduationYear) || graduationYear < 2000) {
      return res.status(400).json({ detail: 'Graduation year is required.' })
    }
    const urlFields = { github_url: githubUrl, linkedin_url: payload.linkedin_url, portfolio_url: payload.portfolio_url }
    for (const [field, value] of Object.entries(urlFields)) {
      if (!isValidHttpUrl(value)) {
        return res.status(400).json({ detail: `${field.replace(/_/g, ' ')} must be a valid http(s) URL.` })
      }
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ detail: 'An account with that email already exists.' })
    }

    const requireVerification = true
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const passwordHash = await bcrypt.hash(password, 10)
    let user
    await sequelize.transaction(async (t) => {
      user = await User.create(
        {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          branch: normalizedBranch,
          graduation_year: graduationYear,
          github_url: githubUrl || null,
          bio: payload.bio || null,
          linkedin_url: payload.linkedin_url || null,
          portfolio_url: payload.portfolio_url || null,
          email_verified: false,
          email_verification_token: verificationToken,
          is_onboarded: true,
        },
        { transaction: t }
      )

      await assignSkills(user, skills, { transaction: t })
    })

    const verifyUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`

    // Send verification email via Brevo (with fallback chain)
    const mailResult = await sendVerificationEmail(email, verifyUrl)
    if (mailResult && !mailResult.sent && !mailResult.simulated) {
      console.error(`[AUTH REGISTER] Verification email delivery failed for ${email}: ${mailResult.error}`)
      // Don't block registration — user can request resend
    }

    return res.status(201).json({
      message: 'Account created! Please check your campus email to verify your account before logging in.',
      requires_verification: true,
      user: serializeUser(user, {}, true),
    })
  } catch (error) {
    return next(error)
  }
})

// ─── Email verification ──────────────────────────────────────

router.get('/verify-email', async (req, res, next) => {
  try {
    const token = String(req.query.token || '').trim()
    if (!token) {
      return res.status(400).json({ detail: 'Verification token is required.' })
    }

    const user = await User.findOne({ where: { email_verification_token: token } })
    if (!user) {
      return res.status(400).json({ detail: 'Invalid or expired verification token.' })
    }

    if (user.email_verified) {
      return res.json({ message: 'Email already verified. You can log in.' })
    }

    await user.update({
      email_verified: true,
      email_verification_token: null,
    })

    return res.json({ message: 'Email verified successfully. You can now log in.', verified: true })
  } catch (error) {
    return next(error)
  }
})

// ─── Login ───────────────────────────────────────────────────

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required.' })
    }
    if (!isCampusEmail(email)) {
      return res
        .status(400)
        .json({ detail: 'Only Rishihood email addresses (e.g. you@depart.rishihood.edu.in or you@rishihood.edu.in) are allowed.' })
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Skill, as: 'skills' }],
    })

    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password.' })
    }

    if (!user.password_hash) {
      return res.status(400).json({
        detail: 'This account was created with Google Sign-In. Please sign in with Google.',
      })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ detail: 'Invalid email or password.' })
    }

    // Suspension is only revealed after valid credentials (#57)
    if (user.is_suspended) {
      return res.status(403).json({
        detail: 'Your account has been suspended. Please contact a platform administrator.',
      })
    }

    // Email verification check removed as requested by user

    const jwt = signToken(user)
    const refreshStr = generateRefreshToken()

    // Opportunistic cleanup of expired refresh tokens (#24)
    await RefreshToken.destroy({ where: { expires_at: { [Op.lt]: new Date() } } })

    // Save hash only — the raw token exists solely in the HttpOnly cookie (#24)
    await RefreshToken.create({
      user_id: user.id,
      token: hashToken(refreshStr),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    setAuthCookies(res, jwt, refreshStr)

    return res.json({ user: serializeUser(user, {}, true) })
  } catch (error) {
    return next(error)
  }
})

// ─── Logout ──────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token
  if (refreshToken) {
    await RefreshToken.update(
      { is_revoked: true },
      { where: { token: hashToken(refreshToken) } }
    )
  }

  const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
  }
  res.clearCookie('token', cookieOptions)
  res.clearCookie('refresh_token', cookieOptions)
  return res.json({ message: 'Logged out.' })
})

// ─── Refresh Token ───────────────────────────────────────────

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      return res.status(401).json({ detail: 'Refresh token missing.' })
    }

    const tokenRecord = await RefreshToken.findOne({
      where: {
        token: hashToken(refreshToken),
        is_revoked: false,
        expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: User, as: 'user' }],
    })

    if (!tokenRecord || !tokenRecord.user) {
      // Clear cookies if invalid
      const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
      res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'None' : 'Lax', path: '/' })
      res.clearCookie('refresh_token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'None' : 'Lax', path: '/' })
      return res.status(401).json({ detail: 'Invalid or expired refresh token.' })
    }

    // A suspension revokes outstanding refresh tokens, but a token that slips
    // through before the revocation must not mint a new session (#57)
    if (tokenRecord.user.is_suspended) {
      await tokenRecord.update({ is_revoked: true })
      const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
      res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'None' : 'Lax', path: '/' })
      res.clearCookie('refresh_token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'None' : 'Lax', path: '/' })
      return res.status(403).json({ detail: 'Your account has been suspended. Please contact a platform administrator.' })
    }

    // Revoke old refresh token (token rotation)
    await tokenRecord.update({ is_revoked: true })

    // Issue new tokens
    const newJwt = signToken(tokenRecord.user)
    const newRefreshStr = generateRefreshToken()

    await RefreshToken.create({
      user_id: tokenRecord.user_id,
      token: hashToken(newRefreshStr),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    setAuthCookies(res, newJwt, newRefreshStr)

    return res.json({ message: 'Token refreshed successfully.' })
  } catch (error) {
    return next(error)
  }
})

// ─── Resend verification ─────────────────────────────────────

router.post('/resend-verification', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    if (!email) {
      return res.status(400).json({ detail: 'Email is required.' })
    }

    const genericResponse = { message: 'If an account with that email exists and is unverified, a verification link has been sent.' }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      // Don't reveal whether the account exists (#23)
      return res.json(genericResponse)
    }

    if (user.email_verified) {
      // Same generic response — no account-state enumeration (#23)
      return res.json(genericResponse)
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    await user.update({ email_verification_token: verificationToken })

    const verifyUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`

    // Send via Brevo (with fallback chain)
    await sendVerificationEmail(email, verifyUrl)

    return res.json(genericResponse)
  } catch (error) {
    return next(error)
  }
})

// ─── Forgot password (sends expiring scoped reset token) ──────

router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    if (!email) {
      return res.status(400).json({ detail: 'Email is required.' })
    }
    if (!isCampusEmail(email)) {
      return res.status(400).json({
        detail: 'Only Rishihood email addresses are allowed.',
      })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      // Generic message to prevent account enumeration
      return res.json({
        message: 'If an account with that email exists, password reset instructions have been sent.',
      })
    }

    // Generate a secure 32-byte random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

    // Save hashed token and expiry in DB
    await user.update({
      password_reset_token: hashedToken,
      password_reset_expires_at: expiresAt,
    })

    const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

    // Send reset email containing the scoped reset link
    const mailResult = await sendPasswordResetEmail(email, resetUrl)

    if (mailResult && !mailResult.sent && !mailResult.simulated) {
      console.error(`[AUTH FORGOT PASSWORD ERROR] Email delivery failed for ${email}: ${mailResult.error}`)
      return res.status(500).json({
        detail: 'Email delivery service is currently unavailable. Please try again later or contact support.',
      })
    }

    const isDevSimulated = mailResult && mailResult.simulated

    return res.json({
      message: isDevSimulated && process.env.NODE_ENV !== 'production'
        ? `Password reset link generated for dev: ${resetUrl}`
        : 'If an account with that email exists, password reset instructions have been sent to your email.',
      reset_url: isDevSimulated && process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    })
  } catch (error) {
    return next(error)
  }
})

// ─── Reset password (verifies token and sets new password) ───

router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim()
    const newPassword = String(req.body?.new_password || '').trim()

    if (!token) {
      return res.status(400).json({ detail: 'Password reset token is required.' })
    }
    if (!newPassword) {
      return res.status(400).json({ detail: 'New password is required.' })
    }

    const pwResult = validatePassword(newPassword)
    if (!pwResult.valid) {
      return res.status(400).json({ detail: pwResult.errors.join(' ') })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires_at: {
          [Op.gt]: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({
        detail: 'Invalid or expired password reset link. Please request a new one.',
      })
    }

    const newHash = await bcrypt.hash(newPassword, 10)

    await user.update({
      password_hash: newHash,
      password_reset_token: null,
      password_reset_expires_at: null,
    })

    // Kill every existing session — a stolen cookie must not survive a reset (#25)
    await RefreshToken.update(
      { is_revoked: true },
      { where: { user_id: user.id, is_revoked: false } }
    )

    logAudit({
      action: 'auth.password_reset_completed',
      req,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'user',
      entityId: user.id,
    })

    return res.json({
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    })
  } catch (error) {
    return next(error)
  }
})

// ─── Change password (authenticated) ─────────────────────────

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.current_password || '')
    const newPassword = String(req.body?.new_password || '')

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ detail: 'Current password and new password are required.' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ detail: 'Current password is incorrect.' })
    }

    const pwResult = validatePassword(newPassword)
    if (!pwResult.valid) {
      return res.status(400).json({ detail: pwResult.errors.join(' ') })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await user.update({ password_hash: newHash })

    // Revoke other sessions on password change (#25)
    await RefreshToken.update(
      { is_revoked: true },
      { where: { user_id: user.id, is_revoked: false } }
    )

    logAudit({
      action: 'auth.password_changed',
      req,
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'user',
      entityId: user.id,
    })

    return res.json({ message: 'Password changed successfully. Please sign in again.' })
  } catch (error) {
    return next(error)
  }
})

// ─── Google OAuth Sign-In / Sign-Up ──────────────────────────

router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const credential = String(req.body?.credential || '').trim()
    if (!credential) {
      return res.status(400).json({ detail: 'Google credential ID token is required.' })
    }

    // Verify token with Google's tokeninfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
    const payload = await response.json()

    if (!response.ok || !payload.email) {
      return res.status(401).json({ detail: 'Invalid or expired Google credential. Please try again.' })
    }

    // --- Security: Validate audience (aud) claim against our own Client ID ---
    // This prevents tokens issued to other apps from being accepted.
    const configuredClientId = (process.env.GOOGLE_CLIENT_ID || '').trim()
    if (configuredClientId) {
      const tokenAud = payload.aud
      const validAudiences = Array.isArray(tokenAud) ? tokenAud : [tokenAud]
      if (!validAudiences.includes(configuredClientId)) {
        console.warn('[GOOGLE AUTH] Token audience mismatch. aud:', tokenAud, 'expected:', configuredClientId)
        return res.status(401).json({ detail: 'Invalid Google credential token audience.' })
      }
    } else {
      // Fail closed in production — accepting tokens without an audience
      // check would honor ID tokens minted for other OAuth clients (#26)
      const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
      if (isProd) {
        console.error('[GOOGLE AUTH] GOOGLE_CLIENT_ID env var is not set in production. Rejecting Google sign-in.')
        return res.status(503).json({ detail: 'Google sign-in is not configured. Please contact support.' })
      }
      console.warn('[GOOGLE AUTH] GOOGLE_CLIENT_ID not set — skipping audience validation (dev only).')
    }

    // --- Security: Google must attest the email is verified ---
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      return res.status(403).json({ detail: 'Your Google account email is not verified. Please verify it with Google first.' })
    }

    const email = normalizeEmail(payload.email)
    if (!isCampusEmail(email)) {
      return res.status(403).json({
        detail: 'Please sign in with your Rishihood campus Google account (e.g. you@nst.rishihood.edu.in). Personal Gmail accounts are not permitted.',
      })
    }

    const googleId = payload.sub
    let user = await User.findOne({
      where: {
        [Op.or]: [{ google_id: googleId }, { email }],
      },
      include: [{ model: Skill, as: 'skills' }],
    })

    if (user) {
      // Update existing user with Google ID and verified status
      const updates = {}
      if (!user.google_id) updates.google_id = googleId
      if (!user.email_verified) updates.email_verified = true
      if (!user.avatar_url && payload.picture) updates.avatar_url = payload.picture
      if (Object.keys(updates).length > 0) {
        await user.update(updates)
      }
    } else {
      // Create new user account via Google
      const currentYear = new Date().getFullYear()
      user = await User.create({
        email,
        full_name: payload.name || email.split('@')[0],
        google_id: googleId,
        auth_provider: 'GOOGLE',
        email_verified: true,
        is_onboarded: false,
        branch: 'General',
        graduation_year: currentYear + 2,
        avatar_url: payload.picture || null,
      })
      user = await User.findByPk(user.id, {
        include: [{ model: Skill, as: 'skills' }],
      })
    }

    const jwt = signToken(user)
    const refreshStr = generateRefreshToken()

    await RefreshToken.create({
      user_id: user.id,
      token: hashToken(refreshStr),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    setAuthCookies(res, jwt, refreshStr)

    return res.json({ user: serializeUser(user, {}, true) })
  } catch (error) {
    return next(error)
  }
})

// ─── Password rules (public endpoint for frontend) ──────────

router.get('/password-rules', (req, res) => {
  return res.json({
    rules: [
      'Minimum 12 characters',
      'At least one uppercase letter',
      'At least one lowercase letter',
      'At least one digit',
      'At least one special character (!@#$%…)',
      'Not a commonly-breached password',
    ],
  })
})

// ─── Onboarding for Google Users ─────────────────────────────

router.post('/onboard', requireAuth, async (req, res, next) => {
  try {
    const { password, branch, graduation_year } = req.body

    if (req.user.is_onboarded) {
      return res.status(400).json({ detail: 'Profile is already onboarded.' })
    }

    if (!password) {
      return res.status(400).json({ detail: 'Password is required.' })
    }

    const pwResult = validatePassword(password)
    if (!pwResult.valid) {
      return res.status(400).json({ detail: pwResult.errors.join(' ') })
    }

    if (!branch) {
      return res.status(400).json({ detail: 'Course / branch is required.' })
    }
    const normalizedBranch = normalizeCourse(branch)
    if (!normalizedBranch) {
      return res.status(400).json({
        detail: `Invalid course. Must be one of: ${VALID_COURSES.join(', ')}.`,
      })
    }
    const gradYearNum = Number(graduation_year)
    if (!Number.isInteger(gradYearNum) || gradYearNum < 2000) {
      return res.status(400).json({ detail: 'Valid graduation year is required.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await req.user.update({
      password_hash: passwordHash,
      branch: normalizedBranch,
      graduation_year: gradYearNum,
      is_onboarded: true,
    })

    return res.json({ message: 'Profile completed.', user: serializeUser(req.user, {}, true) })
  } catch (error) {
    return next(error)
  }
})

module.exports = router

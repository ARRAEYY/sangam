const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { Sequelize, Op } = require('sequelize')
const { sequelize, User, Skill } = require('../models')
const { signToken } = require('../utils/auth')
const { serializeUser } = require('../utils/serializers')
const { validatePassword } = require('../utils/passwordPolicy')
const { authLimiter } = require('../middleware/rateLimit')
const { requireAuth } = require('../middleware/auth')
const { sendPasswordResetEmail } = require('../utils/mailer')
const { normalizeCourse, isValidCourse, VALID_COURSES } = require('../utils/courses')

const router = express.Router()

const TOKEN_EXPIRE_MINUTES = Number(process.env.JWT_EXPIRE_MINUTES || 10080)

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

/** Helper: set the auth cookie on the response */
function setTokenCookie(res, jwt) {
  res.cookie('token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: TOKEN_EXPIRE_MINUTES * 60 * 1000,
    path: '/',
  })
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
    if (githubUrl && !/^https?:\/\//i.test(githubUrl)) {
      return res.status(400).json({ detail: 'GitHub URL must be a valid URL.' })
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ detail: 'An account with that email already exists.' })
    }

    const requireVerification = process.env.ENABLE_EMAIL_VERIFICATION === 'true'
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
          email_verified: !requireVerification,
          email_verification_token: requireVerification ? verificationToken : null,
        },
        { transaction: t }
      )

      await assignSkills(user, skills, { transaction: t })
    })

    if (requireVerification) {
      const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`
      console.log(`\n📧 Email verification link for ${email}:\n   ${verifyUrl}\n`)
      return res.status(201).json({
        message: 'Account created! Please check your email to verify your account before logging in.',
        requires_verification: true,
      })
    }

    const jwt = signToken(user)
    setTokenCookie(res, jwt)

    return res.status(201).json({
      access_token: jwt,
      user: serializeUser(user),
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

    // In production, redirect to the frontend login page
    const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5173'
    return res.redirect(`${frontendUrl}/auth?verified=true`)
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

    // Only block if email verification is explicitly enabled via environment variable
    if (process.env.ENABLE_EMAIL_VERIFICATION === 'true' && !user.email_verified) {
      return res.status(403).json({
        detail: 'Please verify your email before logging in. Check your inbox for the verification link.',
        email_unverified: true,
      })
    }

    const jwt = signToken(user)
    setTokenCookie(res, jwt)

    return res.json({ access_token: jwt, user: serializeUser(user) })
  } catch (error) {
    return next(error)
  }
})

// ─── Logout ──────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  })
  return res.json({ message: 'Logged out.' })
})

// ─── Resend verification ─────────────────────────────────────

router.post('/resend-verification', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    if (!email) {
      return res.status(400).json({ detail: 'Email is required.' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      // Don't reveal whether the account exists
      return res.json({ message: 'If an account with that email exists, a verification link has been sent.' })
    }

    if (user.email_verified) {
      return res.json({ message: 'Email is already verified. You can log in.' })
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    await user.update({ email_verification_token: verificationToken })

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`
    console.log(`\n📧 Resent verification link for ${email}:\n   ${verifyUrl}\n`)

    return res.json({
      message: 'If an account with that email exists, a verification link has been sent.',
      verify_url: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
    })
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

    return res.json({ message: 'Password changed successfully.' })
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
      return res.status(401).json({ detail: payload.error_description || 'Invalid Google credential token.' })
    }

    const email = normalizeEmail(payload.email)
    if (!isCampusEmail(email)) {
      return res.status(400).json({
        detail: 'Only Rishihood email addresses (e.g. you@depart.rishihood.edu.in) are permitted to sign in.',
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
        branch: 'General',
        graduation_year: currentYear + 2,
        avatar_url: payload.picture || null,
      })
      user = await User.findByPk(user.id, {
        include: [{ model: Skill, as: 'skills' }],
      })
    }

    const jwt = signToken(user)
    setTokenCookie(res, jwt)

    return res.json({ access_token: jwt, user: serializeUser(user) })
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

module.exports = router

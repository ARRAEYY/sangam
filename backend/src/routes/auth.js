const express = require('express')
const bcrypt = require('bcryptjs')
const { User, Skill } = require('../models')
const { signToken } = require('../utils/auth')
const { serializeUser } = require('../utils/serializers')

const router = express.Router()

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeSkillName(value) {
  return String(value || '').trim()
}

function isCampusEmail(email) {
  const allowedDomains = ['nst.rishihood.edu.in', 'rishiood.edu.in']
  const domain = String(email || '').toLowerCase().split('@')[1]
  return Boolean(domain && allowedDomains.includes(domain))
}

async function assignSkills(user, skills = []) {
  const names = [...new Set((skills || []).map(normalizeSkillName).filter(Boolean))]

  const skillRecords = await Promise.all(
    names.map(async (name) => {
      const record = await Skill.findOne({ where: { name } })
      if (record) return record
      return Skill.create({ name })
    })
  )

  await user.setSkills(skillRecords)
}

router.post('/register', async (req, res, next) => {
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
        .json({ detail: 'Only @nst.rishihood.edu.in and @rishiood.edu.in email addresses are allowed.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters long.' })
    }
    if (!branch) {
      return res.status(400).json({ detail: 'Branch is required.' })
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

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      branch,
      graduation_year: graduationYear,
      github_url: githubUrl || null,
      bio: payload.bio || null,
      linkedin_url: payload.linkedin_url || null,
      portfolio_url: payload.portfolio_url || null,
    })

    await assignSkills(user, skills)

    const token = signToken(user)
    return res.status(201).json({ access_token: token })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required.' })
    }
    if (!isCampusEmail(email)) {
      return res
        .status(400)
        .json({ detail: 'Only @nst.rishihood.edu.in and @rishiood.edu.in email addresses are allowed.' })
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
        detail: 'This account uses Google Sign-In. Please continue with Google instead.',
      })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ detail: 'Invalid email or password.' })
    }

    const token = signToken(user)
    return res.json({ access_token: token })
  } catch (error) {
    return next(error)
  }
})


module.exports = router

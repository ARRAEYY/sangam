const express = require('express')
const { Op } = require('sequelize')
const { User, Skill } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { serializeUser } = require('../utils/serializers')

const router = express.Router()

async function loadUserWithSkills(userId) {
  return User.findByPk(userId, {
    include: [{ model: Skill, as: 'skills' }],
    attributes: { exclude: ['password_hash'] },
  })
}

async function assignSkills(user, skills = []) {
  const uniqueSkills = [...new Set((skills || []).map((skill) => String(skill).trim()).filter(Boolean))]
  const skillRecords = await Promise.all(
    uniqueSkills.map(async (name) => {
      const record = await Skill.findOne({ where: { name } })
      if (record) return record
      return Skill.create({ name })
    })
  )
  await user.setSkills(skillRecords)
}

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await loadUserWithSkills(req.user.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }
    return res.json(serializeUser(user))
  } catch (error) {
    return next(error)
  }
})

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {}
    const updates = {}

    if (payload.full_name !== undefined) {
      const value = String(payload.full_name || '').trim()
      if (!value) {
        return res.status(400).json({ detail: 'Full name is required.' })
      }
      updates.full_name = value
    }
    if (payload.branch !== undefined) {
      const value = String(payload.branch || '').trim()
      if (!value) {
        return res.status(400).json({ detail: 'Branch is required.' })
      }
      updates.branch = value
    }
    if (payload.graduation_year !== undefined) {
      const value = Number(payload.graduation_year)
      if (!Number.isInteger(value) || value < 2000) {
        return res.status(400).json({ detail: 'Graduation year is required.' })
      }
      updates.graduation_year = value
    }
    if (payload.bio !== undefined) updates.bio = String(payload.bio || '') || null
    if (payload.github_url !== undefined) {
      const value = String(payload.github_url || '').trim()
      updates.github_url = value || null
    }
    if (payload.linkedin_url !== undefined) {
      const value = String(payload.linkedin_url || '').trim()
      updates.linkedin_url = value || null
    }
    if (payload.portfolio_url !== undefined) {
      const value = String(payload.portfolio_url || '').trim()
      updates.portfolio_url = value || null
    }

    if (Object.keys(updates).length > 0) {
      await User.update(updates, { where: { id: req.user.id } })
    }

    const user = await loadUserWithSkills(req.user.id)
    if (payload.skills !== undefined) {
      await assignSkills(user, payload.skills)
    }

    const refreshed = await loadUserWithSkills(req.user.id)
    return res.json(serializeUser(refreshed))
  } catch (error) {
    return next(error)
  }
})

router.get('/talent', async (req, res, next) => {
  try {
    const skillFilter = String(req.query.skill || '').trim()

    const query = {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Skill, as: 'skills' }],
      order: [['full_name', 'ASC']],
    }

    if (skillFilter) {
      query.include[0].where = {
        name: {
          [Op.like]: `%${skillFilter}%`,
        },
      }
      query.include[0].required = true
    }

    const users = await User.findAll(query)
    return res.json(users.map(serializeUser))
  } catch (error) {
    return next(error)
  }
})

module.exports = router

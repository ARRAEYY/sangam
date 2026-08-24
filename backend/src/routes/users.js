const express = require('express')
const { Op } = require('sequelize')
const { User, Skill, Experience, Application, Project } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { serializeUser, serializeExperience, serializeProject } = require('../utils/serializers')

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

router.get('/:id/public', requireAuth, async (req, res, next) => {
  try {
    const user = await loadUserWithSkills(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    const experiences = await Experience.findAll({
      where: { user_id: req.params.id },
      order: [['start_date', 'DESC']],
    })

    const applications = await Application.findAll({
      where: { user_id: req.params.id, status: 'ACCEPTED' },
      include: [{ model: Project, as: 'project' }],
    })

    const serializedUser = serializeUser(user)
    serializedUser.experiences = experiences.map(serializeExperience)
    serializedUser.accepted_projects = applications.map(app => serializeProject(app.project))

    return res.json(serializedUser)
  } catch (error) {
    return next(error)
  }
})

router.post('/experience', requireAuth, async (req, res, next) => {
  try {
    const { organization, role, description, start_date, end_date } = req.body
    if (!organization || !role || !start_date) {
      return res.status(400).json({ detail: 'Organization, role, and start_date are required.' })
    }

    const experience = await Experience.create({
      user_id: req.user.id,
      organization,
      role,
      description: description || null,
      start_date,
      end_date: end_date || null,
    })

    return res.status(201).json(serializeExperience(experience))
  } catch (error) {
    return next(error)
  }
})

router.put('/experience/:id', requireAuth, async (req, res, next) => {
  try {
    const experience = await Experience.findByPk(req.params.id)
    if (!experience) {
      return res.status(404).json({ detail: 'Experience not found.' })
    }
    if (experience.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only edit your own experience.' })
    }

    const { organization, role, description, start_date, end_date } = req.body
    if (organization) experience.organization = organization
    if (role) experience.role = role
    if (description !== undefined) experience.description = description || null
    if (start_date) experience.start_date = start_date
    if (end_date !== undefined) experience.end_date = end_date || null

    await experience.save()
    return res.json(serializeExperience(experience))
  } catch (error) {
    return next(error)
  }
})

router.delete('/experience/:id', requireAuth, async (req, res, next) => {
  try {
    const experience = await Experience.findByPk(req.params.id)
    if (!experience) {
      return res.status(404).json({ detail: 'Experience not found.' })
    }
    if (experience.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only delete your own experience.' })
    }

    await experience.destroy()
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

module.exports = router

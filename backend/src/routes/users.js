const express = require('express')
const { Op, Sequelize } = require('sequelize')
const {
  sequelize,
  User,
  Skill,
  Experience,
  Education,
  Achievement,
  Application,
  Project,
  Notification,
  ConnectionRequest,
  Connection,
  ProjectMember,
} = require('../models')
const { requireAuth } = require('../middleware/auth')
const {
  serializeUser,
  serializeExperience,
  serializeEducation,
  serializeAchievement,
  serializeProject,
} = require('../utils/serializers')
const { normalizeCourse, isValidCourse, VALID_COURSES } = require('../utils/courses')

const router = express.Router()

async function loadUserWithSkills(userId, options = {}) {
  return User.findByPk(userId, {
    include: [{ model: Skill, as: 'skills' }],
    attributes: { exclude: ['password_hash'] },
    ...options,
  })
}

async function assignSkills(user, skills = [], options = {}) {
  const uniqueSkills = [...new Set((skills || []).map((skill) => String(skill).trim()).filter(Boolean))]
  const skillRecords = await Promise.all(
    uniqueSkills.map(async (name) => {
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
        return res.status(400).json({ detail: 'Course / branch is required.' })
      }
      const normalized = normalizeCourse(value)
      if (!normalized) {
        return res.status(400).json({
          detail: `Invalid course. Must be one of: ${VALID_COURSES.join(', ')}.`,
        })
      }
      updates.branch = normalized
    }
    if (payload.graduation_year !== undefined) {
      const value = Number(payload.graduation_year)
      if (!Number.isInteger(value) || value < 2000) {
        return res.status(400).json({ detail: 'Graduation year is required.' })
      }
      updates.graduation_year = value
    }
    if (payload.bio !== undefined) updates.bio = String(payload.bio || '') || null
    if (payload.avatar_url !== undefined) updates.avatar_url = String(payload.avatar_url || '').trim() || null
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
    if (payload.leetcode_url !== undefined) {
      const value = String(payload.leetcode_url || '').trim()
      updates.leetcode_url = value || null
    }
    if (payload.codeforces_url !== undefined) {
      const value = String(payload.codeforces_url || '').trim()
      updates.codeforces_url = value || null
    }

    await sequelize.transaction(async (t) => {
      if (Object.keys(updates).length > 0) {
        await User.update(updates, { where: { id: req.user.id }, transaction: t })
      }

      if (payload.skills !== undefined) {
        const user = await loadUserWithSkills(req.user.id, { transaction: t })
        await assignSkills(user, payload.skills, { transaction: t })
      }
    })

    const refreshed = await loadUserWithSkills(req.user.id)
    return res.json(serializeUser(refreshed))
  } catch (error) {
    return next(error)
  }
})

// Self-service account deletion
router.delete('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    await sequelize.transaction(async (t) => {
      // 1. Delete notifications sent or received
      await Notification.destroy({
        where: { [Op.or]: [{ recipient_id: userId }, { actor_id: userId }] },
        transaction: t,
      })

      // 2. Delete connections and connection requests
      await Connection.destroy({
        where: { [Op.or]: [{ user_a_id: userId }, { user_b_id: userId }] },
        transaction: t,
      })
      await ConnectionRequest.destroy({
        where: { [Op.or]: [{ requester_id: userId }, { recipient_id: userId }] },
        transaction: t,
      })

      // 3. Delete portfolio items
      await Experience.destroy({ where: { user_id: userId }, transaction: t })
      await Education.destroy({ where: { user_id: userId }, transaction: t })
      await Achievement.destroy({ where: { user_id: userId }, transaction: t })

      // 4. Delete applications submitted by user
      await Application.destroy({ where: { user_id: userId }, transaction: t })

      // 5. Delete projects owned by user and their associated applications
      const ownedProjects = await Project.findAll({ where: { owner_id: userId }, transaction: t })
      for (const project of ownedProjects) {
        await Application.destroy({ where: { project_id: project.id }, transaction: t })
        await Notification.destroy({ where: { project_id: project.id }, transaction: t })
        await project.setRequired_skills([], { transaction: t })
        await project.destroy({ transaction: t })
      }

      // 6. Clear user skills
      await user.setSkills([], { transaction: t })

      // 7. Delete user
      await user.destroy({ transaction: t })
    })

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    })

    return res.json({ message: 'Your account and all associated data have been permanently deleted.' })
  } catch (error) {
    return next(error)
  }
})

router.get('/talent', requireAuth, async (req, res, next) => {
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

router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) {
      return res.json([])
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'full_name', 'email', 'avatar_url', 'headline', 'branch', 'graduation_year'],
      limit: 10,
      order: [['full_name', 'ASC']],
    })

    return res.json(
      users.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        avatar_url: u.avatar_url || null,
        headline: u.headline || null,
        branch: u.branch,
        graduation_year: u.graduation_year,
      }))
    )
  } catch (error) {
    return next(error)
  }
})

router.get('/:id/public', requireAuth, async (req, res, next) => {
  try {
    const userPromise = loadUserWithSkills(req.params.id)
    const experiencesPromise = Experience.findAll({
      where: { user_id: req.params.id },
      order: [['start_date', 'DESC']],
    })
    const educationsPromise = Education.findAll({
      where: { user_id: req.params.id },
      order: [['start_year', 'DESC']],
    })
    const achievementsPromise = Achievement.findAll({
      where: { user_id: req.params.id },
      order: [['date_awarded', 'DESC'], ['created_at', 'DESC']],
    })
    const applicationsPromise = Application.findAll({
      where: { user_id: req.params.id, status: 'ACCEPTED' },
      include: [{ model: Project, as: 'project' }],
    })
    const membershipsPromise = ProjectMember.findAll({
      where: { user_id: req.params.id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'title', 'status'] }],
      order: [['joined_at', 'DESC']],
    })

    const [user, experiences, educations, achievements, applications, memberships] = await Promise.all([
      userPromise,
      experiencesPromise,
      educationsPromise,
      achievementsPromise,
      applicationsPromise,
      membershipsPromise,
    ])

    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    const serializedUser = serializeUser(user, {
      experiences,
      educations,
      achievements,
      memberships,
    })
    serializedUser.experiences = experiences.map(serializeExperience)
    serializedUser.educations = educations.map(serializeEducation)
    serializedUser.achievements = achievements.map(serializeAchievement)
    serializedUser.accepted_projects = applications.filter(app => app.project).map(app => serializeProject(app.project))
    serializedUser.project_roles = memberships
      .filter((m) => m.project) // skip orphans
      .map((m) => ({
        project_id: m.project.id,
        project_title: m.project.title,
        project_status: m.project.status,
        role: m.role,
        role_category: m.role_category,
        is_lead: m.is_lead,
        status: m.status,
        since: m.joined_at,
      }))

    return res.json(serializedUser)
  } catch (error) {
    return next(error)
  }
})

// ─── Experience Endpoints ────────────────────────────────────

router.post('/experience', requireAuth, async (req, res, next) => {
  try {
    const { organization, role, description, start_date, end_date, location, work_type, employment_type } = req.body
    if (!organization || !role || !start_date) {
      return res.status(400).json({ detail: 'Organization, role, and start_date are required.' })
    }

    const experience = await Experience.create({
      user_id: req.user.id,
      organization,
      role,
      description: description || null,
      location: location || null,
      work_type: work_type || 'On-site',
      employment_type: employment_type || 'Full-time',
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

    const { organization, role, description, start_date, end_date, location, work_type, employment_type } = req.body
    if (organization) experience.organization = organization
    if (role) experience.role = role
    if (description !== undefined) experience.description = description || null
    if (location !== undefined) experience.location = location || null
    if (work_type) experience.work_type = work_type
    if (employment_type) experience.employment_type = employment_type
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

// ─── Education Endpoints ─────────────────────────────────────

router.get('/education', requireAuth, async (req, res, next) => {
  try {
    const educations = await Education.findAll({
      where: { user_id: req.user.id },
      order: [['start_year', 'DESC']],
    })
    return res.json(educations.map(serializeEducation))
  } catch (error) {
    return next(error)
  }
})

router.post('/education', requireAuth, async (req, res, next) => {
  try {
    const { institution, degree, department, start_year, graduation_year } = req.body
    if (!institution || !degree || !start_year) {
      return res.status(400).json({ detail: 'Institution, degree, and start_year are required.' })
    }

    const education = await Education.create({
      user_id: req.user.id,
      institution: String(institution).trim(),
      degree: String(degree).trim(),
      department: department ? String(department).trim() : null,
      start_year: Number(start_year),
      graduation_year: graduation_year ? Number(graduation_year) : null,
    })

    return res.status(201).json(serializeEducation(education))
  } catch (error) {
    return next(error)
  }
})

router.put('/education/:id', requireAuth, async (req, res, next) => {
  try {
    const education = await Education.findByPk(req.params.id)
    if (!education) {
      return res.status(404).json({ detail: 'Education record not found.' })
    }
    if (education.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only edit your own education records.' })
    }

    const { institution, degree, department, start_year, graduation_year } = req.body
    if (institution) education.institution = String(institution).trim()
    if (degree) education.degree = String(degree).trim()
    if (department !== undefined) education.department = department ? String(department).trim() : null
    if (start_year) education.start_year = Number(start_year)
    if (graduation_year !== undefined) education.graduation_year = graduation_year ? Number(graduation_year) : null

    await education.save()
    return res.json(serializeEducation(education))
  } catch (error) {
    return next(error)
  }
})

router.delete('/education/:id', requireAuth, async (req, res, next) => {
  try {
    const education = await Education.findByPk(req.params.id)
    if (!education) {
      return res.status(404).json({ detail: 'Education record not found.' })
    }
    if (education.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only delete your own education records.' })
    }

    await education.destroy()
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

// ─── Achievement Endpoints ───────────────────────────────────

router.get('/achievements', requireAuth, async (req, res, next) => {
  try {
    const achievements = await Achievement.findAll({
      where: { user_id: req.user.id },
      order: [['date_awarded', 'DESC'], ['created_at', 'DESC']],
    })
    return res.json(achievements.map(serializeAchievement))
  } catch (error) {
    return next(error)
  }
})

router.post('/achievements', requireAuth, async (req, res, next) => {
  try {
    const { type, title, description, issuer, date_awarded, url } = req.body
    if (!title) {
      return res.status(400).json({ detail: 'Title is required.' })
    }

    const validTypes = Achievement.TYPES || ['HACKATHON', 'CERTIFICATION', 'AWARD', 'COMPETITION', 'OTHER']
    const safeType = validTypes.includes(type) ? type : 'OTHER'

    const achievement = await Achievement.create({
      user_id: req.user.id,
      type: safeType,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      issuer: issuer ? String(issuer).trim() : null,
      date_awarded: date_awarded || null,
      url: url ? String(url).trim() : null,
    })

    return res.status(201).json(serializeAchievement(achievement))
  } catch (error) {
    return next(error)
  }
})

router.put('/achievements/:id', requireAuth, async (req, res, next) => {
  try {
    const achievement = await Achievement.findByPk(req.params.id)
    if (!achievement) {
      return res.status(404).json({ detail: 'Achievement not found.' })
    }
    if (achievement.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only edit your own achievements.' })
    }

    const { type, title, description, issuer, date_awarded, url } = req.body
    const validTypes = Achievement.TYPES || ['HACKATHON', 'CERTIFICATION', 'AWARD', 'COMPETITION', 'OTHER']
    if (type && validTypes.includes(type)) achievement.type = type
    if (title) achievement.title = String(title).trim()
    if (description !== undefined) achievement.description = description ? String(description).trim() : null
    if (issuer !== undefined) achievement.issuer = issuer ? String(issuer).trim() : null
    if (date_awarded !== undefined) achievement.date_awarded = date_awarded || null
    if (url !== undefined) achievement.url = url ? String(url).trim() : null

    await achievement.save()
    return res.json(serializeAchievement(achievement))
  } catch (error) {
    return next(error)
  }
})

router.delete('/achievements/:id', requireAuth, async (req, res, next) => {
  try {
    const achievement = await Achievement.findByPk(req.params.id)
    if (!achievement) {
      return res.status(404).json({ detail: 'Achievement not found.' })
    }
    if (achievement.user_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only delete your own achievements.' })
    }

    await achievement.destroy()
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

module.exports = router

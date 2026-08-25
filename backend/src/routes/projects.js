const express = require('express')
const { Op, Sequelize } = require('sequelize')
const { sequelize, Project, User, Skill, Application } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { serializeProject, serializeApplication } = require('../utils/serializers')
const { notifyProjectApplication } = require('../services/notificationService')

const router = express.Router()

async function assignSkills(project, skills = [], options = {}) {
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
  await project.setRequired_skills(skillRecords, options)
}

router.get('/', async (req, res, next) => {
  try {
    const skillFilter = String(req.query.skill || '').trim()

    const query = {
      where: {
        status: {
          [Op.ne]: 'ARCHIVED',
        },
      },
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name'] },
      ],
      order: [['created_at', 'DESC']],
    }

    if (skillFilter) {
      query.include[0].where = {
        name: {
          [Op.like]: `%${skillFilter}%`,
        },
      }
      query.include[0].required = true
    }

    const projects = await Project.findAll(query)
    return res.json(projects.map(serializeProject))
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name'] },
      ],
    })

    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }

    return res.json(serializeProject(project))
  } catch (error) {
    return next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {}
    const title = String(payload.title || '').trim()
    const description = String(payload.description || '').trim()
    const teamSizeNeeded = Number(payload.team_size_needed)
    const skills = Array.isArray(payload.skills) ? payload.skills : []

    if (!title) {
      return res.status(400).json({ detail: 'Title is required.' })
    }
    if (!description) {
      return res.status(400).json({ detail: 'Description is required.' })
    }
    if (!Number.isInteger(teamSizeNeeded) || teamSizeNeeded < 1) {
      return res.status(400).json({ detail: 'Team size needed must be a positive integer.' })
    }

    let project
    await sequelize.transaction(async (t) => {
      project = await Project.create(
        {
          title,
          description,
          team_size_needed: teamSizeNeeded,
          owner_id: req.user.id,
          status: 'OPEN',
        },
        { transaction: t }
      )

      await assignSkills(project, skills, { transaction: t })
    })

    const created = await Project.findByPk(project.id, {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name'] },
      ],
    })

    return res.status(201).json(serializeProject(created))
  } catch (error) {
    return next(error)
  }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project owner can update this project.' })
    }

    const payload = req.body || {}
    if (payload.title !== undefined) {
      const title = String(payload.title || '').trim()
      if (!title) return res.status(400).json({ detail: 'Title is required.' })
      project.title = title
    }
    if (payload.description !== undefined) {
      const description = String(payload.description || '').trim()
      if (!description) return res.status(400).json({ detail: 'Description is required.' })
      project.description = description
    }
    if (payload.team_size_needed !== undefined) {
      const teamSizeNeeded = Number(payload.team_size_needed)
      if (!Number.isInteger(teamSizeNeeded) || teamSizeNeeded < 1) {
        return res.status(400).json({ detail: 'Team size needed must be a positive integer.' })
      }
      project.team_size_needed = teamSizeNeeded
    }

    await sequelize.transaction(async (t) => {
      await project.save({ transaction: t })

      if (payload.skills !== undefined) {
        const skills = Array.isArray(payload.skills) ? payload.skills : []
        await assignSkills(project, skills, { transaction: t })
      }
    })

    const updated = await Project.findByPk(project.id, {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name'] },
      ],
    })

    return res.json(serializeProject(updated))
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project owner can update the project status.' })
    }

    const status = String(req.body?.status || '').trim().toUpperCase()
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ detail: 'Status must be OPEN, IN_PROGRESS, COMPLETED, or ARCHIVED.' })
    }

    await project.update({ status })
    const refreshed = await Project.findByPk(project.id, {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name'] },
      ],
    })
    return res.json(serializeProject(refreshed))
  } catch (error) {
    return next(error)
  }
})

router.post('/:id/apply', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }
    if (project.owner_id === req.user.id) {
      return res.status(403).json({ detail: 'You cannot apply to your own project.' })
    }

    const pitchMessage = String(req.body?.pitch_message || '').trim()
    if (!pitchMessage) {
      return res.status(400).json({ detail: 'Pitch message is required.' })
    }

    const existing = await Application.findOne({
      where: {
        project_id: project.id,
        user_id: req.user.id,
      },
    })
    if (existing) {
      return res.status(409).json({ detail: 'You have already applied to this project.' })
    }

    const application = await Application.create({
      project_id: project.id,
      user_id: req.user.id,
      pitch_message: pitchMessage,
      status: 'PENDING',
    })

    await notifyProjectApplication({ project, applicant: req.user })

    return res.status(201).json({
      id: application.id,
      project_id: application.project_id,
      user_id: application.user_id,
      pitch_message: application.pitch_message,
      status: application.status,
      applied_at: application.created_at || application.createdAt,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id/apps', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project owner can view applicants.' })
    }

    const applications = await Application.findAll({
      where: { project_id: project.id },
      include: [{ model: User, as: 'applicant', attributes: { exclude: ['password_hash'] } }],
      order: [['created_at', 'DESC']],
    })

    return res.json(
      applications.map((application) => ({
        id: application.id,
        pitch_message: application.pitch_message,
        status: application.status,
        applied_at: application.created_at || application.createdAt,
        applicant: application.applicant
          ? {
              id: application.applicant.id,
              full_name: application.applicant.full_name,
              email: application.applicant.email,
              github_url: application.applicant.github_url,
            }
          : null,
      }))
    )
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'You can only delete your own projects.' })
    }

    const { Notification } = require('../models')

    await sequelize.transaction(async (t) => {
      // Remove project notifications
      await Notification.destroy({ where: { project_id: project.id }, transaction: t })
      // Remove applications
      await Application.destroy({ where: { project_id: project.id }, transaction: t })
      // Clear required skills association
      await project.setRequired_skills([], { transaction: t })
      // Delete project
      await project.destroy({ transaction: t })
    })

    return res.json({ message: 'Project deleted successfully.' })
  } catch (error) {
    return next(error)
  }
})

module.exports = router

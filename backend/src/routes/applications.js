const express = require('express')
const { Application, Project, User, Skill, ProjectMember } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { serializeApplication } = require('../utils/serializers')
const { notifyApplicationDecision, createNotification } = require('../services/notificationService')

const router = express.Router()

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const applications = await Application.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    })

    return res.json(
      applications.map((application) => ({
        id: application.id,
        project_id: application.project_id,
        status: application.status,
        applied_at: application.created_at || application.createdAt,
      }))
    )
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            { model: Skill, as: 'required_skills' },
            { model: User, as: 'owner', attributes: ['id', 'full_name'] },
          ],
        },
        { model: User, as: 'applicant', attributes: { exclude: ['password_hash'] } },
      ],
    })

    if (!application) {
      return res.status(404).json({ detail: 'Application not found.' })
    }

    const status = String(req.body?.status || '').trim().toUpperCase()
    const isOwner = application.project.owner_id === req.user.id
    const isApplicant = application.user_id === req.user.id

    if (!isOwner && !isApplicant) {
      return res.status(403).json({ detail: 'You are not allowed to update this application.' })
    }

    if (status === 'WITHDRAWN') {
      if (!isApplicant) {
        return res.status(403).json({ detail: 'Only the applicant can withdraw an application.' })
      }
      if (application.status !== 'PENDING') {
        return res.status(409).json({ detail: 'Only pending applications can be withdrawn.' })
      }
    } else if (['ACCEPTED', 'REJECTED'].includes(status)) {
      if (!isOwner) {
        return res.status(403).json({ detail: 'Only the project owner can update application status.' })
      }
      if (application.status !== 'PENDING') {
        return res.status(409).json({ detail: 'This application has already been resolved.' })
      }
    } else {
      return res.status(400).json({ detail: 'Status must be ACCEPTED, REJECTED or WITHDRAWN.' })
    }

    await application.update({ status })

    // On acceptance, create a ProjectMember row
    if (status === 'ACCEPTED') {
      const role = String(req.body?.role || 'Team Member').trim()
      const roleCategory = req.body?.role_category || 'OTHER'
      const validCategories = ProjectMember.ROLE_CATEGORIES

      // Avoid duplicates
      const existingMember = await ProjectMember.findOne({
        where: { project_id: application.project_id, user_id: application.user_id },
      })
      if (!existingMember) {
        await ProjectMember.create({
          project_id: application.project_id,
          user_id: application.user_id,
          role,
          role_category: validCategories.includes(roleCategory) ? roleCategory : 'OTHER',
          is_lead: false,
          status: 'ACTIVE',
        })
      }

      // Notify the member about their role assignment
      await createNotification({
        recipientId: application.user_id,
        actorId: req.user.id,
        type: 'MEMBER_ROLE_ASSIGNED',
        message: `You've been added to "${application.project.title}" as ${role}!`,
        projectId: application.project_id,
      }).catch(() => {}) // non-critical
    }

    if (status === 'ACCEPTED' || status === 'REJECTED') {
      await notifyApplicationDecision({ project: application.project, applicant: application.applicant, status })
    }

    const refreshed = await Application.findByPk(application.id, {
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            { model: Skill, as: 'required_skills' },
            { model: User, as: 'owner', attributes: ['id', 'full_name'] },
          ],
        },
        { model: User, as: 'applicant', attributes: { exclude: ['password_hash'] } },
      ],
    })

    return res.json(serializeApplication(refreshed))
  } catch (error) {
    return next(error)
  }
})

module.exports = router

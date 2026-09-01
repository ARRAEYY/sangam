const express = require('express')
const { Op, Sequelize } = require('sequelize')
const { sequelize, Project, User, Skill, Application, ProjectMember, Milestone } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { generalLimiter } = require('../middleware/rateLimit')
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

// ─── Public Project Teaser (Gated App Social Proof) ───────────
router.get('/teaser', generalLimiter, async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      where: { status: 'OPEN' },
      attributes: ['title'],
      include: [
        {
          model: Skill,
          as: 'required_skills',
          attributes: ['name'],
          through: { attributes: [] },
        },
      ],
      order: sequelize.random(),
      limit: 6,
    })

    const teaserProjects = projects.map((p) => ({
      title: p.title,
      required_skills: (p.required_skills || []).map((s) => s.name),
    }))

    return res.json({ projects: teaserProjects })
  } catch (error) {
    return next(error)
  }
})

router.get('/', requireAuth, async (req, res, next) => {
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
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
    }

    if (req.query.mine === 'true') {
      query.where.owner_id = req.user.id
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

    // Batch count active members per project (avoids N+1)
    const projectIds = projects.map((p) => p.id)
    let memberCounts = {}
    if (projectIds.length > 0) {
      const counts = await ProjectMember.findAll({
        where: { project_id: { [Op.in]: projectIds }, status: 'ACTIVE' },
        attributes: ['project_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
        group: ['project_id'],
        raw: true,
      })
      counts.forEach((row) => {
        memberCounts[row.project_id] = parseInt(row.count, 10)
      })
    }

    const result = projects.map((p) => {
      const serialized = serializeProject(p)
      serialized.member_count = memberCounts[p.id] || 0
      return serialized
    })

    return res.json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url', 'headline'] },
        { 
          model: ProjectMember, 
          as: 'members', 
          include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url', 'headline'] }] 
        },
        { model: Milestone, as: 'milestones' },
      ],
    })

    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }

    // Include member count in detail view too
    const memberCount = await ProjectMember.count({
      where: { project_id: project.id, status: 'ACTIVE' },
    })

    const serialized = serializeProject(project)
    serialized.member_count = memberCount

    return res.json(serialized)
  } catch (error) {
    return next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {}
    const title = String(payload.title || '').trim()
    const description = String(payload.description || '').trim()
    const short_description = payload.short_description ? String(payload.short_description).trim() : null
    const time_horizon = payload.time_horizon ? String(payload.time_horizon).trim() : null
    const tech_stack = Array.isArray(payload.tech_stack) ? payload.tech_stack : []
    const open_roles = Array.isArray(payload.open_roles) ? payload.open_roles : []
    const teamSizeNeeded = Number(payload.team_size_needed)
    const skills = Array.isArray(payload.skills) ? payload.skills : []

    const members = Array.isArray(payload.members) ? payload.members : []
    const milestones = Array.isArray(payload.milestones) ? payload.milestones : []
    const nextMilestone = payload.next_milestone || null

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
    let addedMemberCount = 1 // lead
    
    await sequelize.transaction(async (t) => {
      project = await Project.create(
        {
          title,
          description,
          short_description,
          time_horizon,
          tech_stack,
          open_roles,
          team_size_needed: teamSizeNeeded,
          owner_id: req.user.id,
          status: 'OPEN',
        },
        { transaction: t }
      )

      await assignSkills(project, skills, { transaction: t })

      // Auto-assign owner as project lead
      await ProjectMember.create(
        {
          project_id: project.id,
          user_id: req.user.id,
          role: 'Project Lead',
          role_category: 'LEAD',
          is_lead: true,
          status: 'ACTIVE',
        },
        { transaction: t }
      )

      // Add optional team members
      for (const m of members) {
        if (!m.user_id || !m.role || m.user_id === req.user.id) continue
        
        await ProjectMember.create(
          {
            project_id: project.id,
            user_id: m.user_id,
            role: m.role,
            role_category: m.role_category || 'OTHER',
            is_lead: false,
            status: 'ACTIVE',
          },
          { transaction: t }
        )
        addedMemberCount++
        
        // Notify the added member
        await Notification.create(
          {
            recipient_id: m.user_id,
            actor_id: req.user.id,
            type: 'MEMBER_ROLE_ASSIGNED',
            message: `You were added to "${project.title}" as ${m.role}!`,
            project_id: project.id,
          },
          { transaction: t }
        )
      }

      // Add optional milestones
      for (let i = 0; i < milestones.length; i++) {
        const ms = milestones[i]
        if (!ms.title) continue
        await Milestone.create(
          {
            project_id: project.id,
            title: ms.title,
            description: ms.description || null,
            due_date: ms.targetDate || ms.due_date || null,
            status: ms.status || 'NOT_STARTED',
            created_by: req.user.id,
            order_index: i,
          },
          { transaction: t }
        )
      }
    })

    const created = await Project.findByPk(project.id, {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url'] },
        { model: ProjectMember, as: 'members' },
        { model: Milestone, as: 'milestones' },
      ],
    })

    const serialized = serializeProject(created)
    serialized.member_count = addedMemberCount

    return res.status(201).json(serialized)
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
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url'] },
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
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url'] },
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

// ─── Team Roster Endpoints (Phase 3) ──────────────────────────

// GET /api/projects/:id/members — active members, lead first
router.get('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }

    const members = await ProjectMember.findAll({
      where: { project_id: project.id, status: 'ACTIVE' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url', 'headline'] },
      ],
      order: [
        ['is_lead', 'DESC'],
        ['joined_at', 'ASC'],
      ],
    })

    return res.json(
      members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        role_category: m.role_category,
        is_lead: m.is_lead,
        joined_at: m.joined_at,
        user: m.user
          ? {
              id: m.user.id,
              full_name: m.user.full_name,
              avatar_url: m.user.avatar_url || null,
              headline: m.user.headline || null,
            }
          : null,
      }))
    )
  } catch (error) {
    return next(error)
  }
})

// POST /api/projects/:id/members — lead-only direct add member
router.post('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' })
    }
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project lead can add members.' })
    }

    const { user_id, role, role_category } = req.body || {}
    if (!user_id) {
      return res.status(400).json({ detail: 'User ID is required.' })
    }

    const roleTitle = String(role || '').trim()
    if (!roleTitle) {
      return res.status(400).json({ detail: 'Role title is required.' })
    }

    const validCategory = role_category && ProjectMember.ROLE_CATEGORIES.includes(role_category)
      ? role_category
      : 'OTHER'

    const targetUser = await User.findByPk(user_id, {
      attributes: ['id', 'full_name', 'email', 'avatar_url', 'headline'],
    })
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    // Check existing membership record
    const existingMember = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: targetUser.id },
    })

    let member
    if (existingMember) {
      if (existingMember.status === 'ACTIVE') {
        return res.status(409).json({ detail: 'User is already an active member of this project.' })
      }
      // Reactivate previously left or removed member
      existingMember.status = 'ACTIVE'
      existingMember.role = roleTitle
      existingMember.role_category = validCategory
      existingMember.is_lead = false
      existingMember.joined_at = new Date()
      await existingMember.save()
      member = existingMember
    } else {
      member = await ProjectMember.create({
        project_id: project.id,
        user_id: targetUser.id,
        role: roleTitle,
        role_category: validCategory,
        is_lead: false,
        status: 'ACTIVE',
        joined_at: new Date(),
      })
    }

    // Send notification to added member
    const { createNotification } = require('../services/notificationService')
    await createNotification({
      recipientId: targetUser.id,
      actorId: req.user.id,
      type: 'MEMBER_ROLE_ASSIGNED',
      message: `You were added to "${project.title}" as ${roleTitle}!`,
      projectId: project.id,
    }).catch(() => {})

    return res.status(201).json({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      role_category: member.role_category,
      is_lead: member.is_lead,
      joined_at: member.joined_at,
      status: member.status,
      user: {
        id: targetUser.id,
        full_name: targetUser.full_name,
        avatar_url: targetUser.avatar_url || null,
        headline: targetUser.headline || null,
      },
    })
  } catch (error) {
    return next(error)
  }
})

// PATCH /api/projects/:id/members/:userId — lead-only role update
router.patch('/:id/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project lead can update member roles.' })
    }

    const member = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: req.params.userId, status: 'ACTIVE' },
    })
    if (!member) return res.status(404).json({ detail: 'Member not found.' })

    const { role, role_category } = req.body || {}
    if (role) member.role = String(role).trim()
    if (role_category && ProjectMember.ROLE_CATEGORIES.includes(role_category)) {
      member.role_category = role_category
    }

    await member.save()
    return res.json({ message: 'Role updated.', member_id: member.id, role: member.role, role_category: member.role_category })
  } catch (error) {
    return next(error)
  }
})

// DELETE /api/projects/:id/members/:userId — lead-only remove (soft)
router.delete('/:id/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project lead can remove members.' })
    }

    const member = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: req.params.userId, status: 'ACTIVE' },
    })
    if (!member) return res.status(404).json({ detail: 'Member not found.' })
    if (member.is_lead) return res.status(403).json({ detail: 'The project lead cannot be removed.' })

    await member.update({ status: 'REMOVED' })

    // Notify removed member
    const { createNotification } = require('../services/notificationService')
    await createNotification({
      recipientId: req.params.userId,
      actorId: req.user.id,
      type: 'MEMBER_REMOVED',
      message: `You were removed from "${project.title}".`,
      projectId: project.id,
    }).catch(() => {}) // non-critical

    return res.json({ message: 'Member removed.' })
  } catch (error) {
    return next(error)
  }
})

// POST /api/projects/:id/members/:userId/leave — self-leave
router.post('/:id/members/:userId/leave', requireAuth, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ detail: 'You can only leave for yourself.' })
    }

    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })

    const member = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: req.params.userId, status: 'ACTIVE' },
    })
    if (!member) return res.status(404).json({ detail: 'You are not an active member of this project.' })
    if (member.is_lead) return res.status(403).json({ detail: 'The project lead cannot leave without transferring ownership.' })

    await member.update({ status: 'LEFT' })
    return res.json({ message: 'You have left the project.' })
  } catch (error) {
    return next(error)
  }
})

// ─── Milestone Endpoints (Phase 5) ────────────────────────────

// GET /api/projects/:id/milestones
router.get('/:id/milestones', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })

    const milestones = await Milestone.findAll({
      where: { project_id: project.id },
      order: [['order_index', 'ASC'], ['created_at', 'ASC']],
      include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
    })

    const total = milestones.length
    const completed = milestones.filter((m) => m.status === 'COMPLETED').length

    return res.json({
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        status: m.status,
        order_index: m.order_index,
        due_date: m.due_date,
        completed_at: m.completed_at,
        created_by: m.creator ? { id: m.creator.id, full_name: m.creator.full_name } : null,
        created_at: m.created_at || m.createdAt,
      })),
      progress: { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 },
    })
  } catch (error) {
    return next(error)
  }
})

// POST /api/projects/:id/milestones — lead-only creation
router.post('/:id/milestones', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project lead can add milestones.' })
    }

    const { title, description, due_date } = req.body || {}
    if (!title || !String(title).trim()) {
      return res.status(400).json({ detail: 'Milestone title is required.' })
    }

    // Auto-increment order_index
    const maxOrder = await Milestone.max('order_index', { where: { project_id: project.id } })
    const nextOrder = (maxOrder ?? -1) + 1

    const milestone = await Milestone.create({
      project_id: project.id,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      due_date: due_date || null,
      order_index: nextOrder,
      created_by: req.user.id,
    })

    return res.status(201).json({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      order_index: milestone.order_index,
      due_date: milestone.due_date,
      completed_at: milestone.completed_at,
      created_at: milestone.created_at || milestone.createdAt,
    })
  } catch (error) {
    return next(error)
  }
})

// PATCH /api/projects/:id/milestones/:mid — lead-only update
router.patch('/:id/milestones/:mid', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project lead can update milestones.' })
    }

    const milestone = await Milestone.findOne({
      where: { id: req.params.mid, project_id: project.id },
    })
    if (!milestone) return res.status(404).json({ detail: 'Milestone not found.' })

    const { title, description, status, due_date } = req.body || {}
    if (title !== undefined) milestone.title = String(title).trim()
    if (description !== undefined) milestone.description = description ? String(description).trim() : null
    if (due_date !== undefined) milestone.due_date = due_date || null

    if (status && Milestone.STATUSES.includes(status)) {
      const wasCompleted = milestone.status === 'COMPLETED'
      milestone.status = status
      if (status === 'COMPLETED' && !wasCompleted) {
        milestone.completed_at = new Date()

        // Notify all active project members
        const { createNotification } = require('../services/notificationService')
        const activeMembers = await ProjectMember.findAll({
          where: { project_id: project.id, status: 'ACTIVE' },
          attributes: ['user_id'],
        })
        for (const m of activeMembers) {
          await createNotification({
            recipientId: m.user_id,
            actorId: req.user.id,
            type: 'MILESTONE_COMPLETED',
            message: `Milestone "${milestone.title}" in "${project.title}" is now complete! 🎉`,
            projectId: project.id,
          }).catch(() => {})
        }
      } else if (status !== 'COMPLETED') {
        milestone.completed_at = null
      }
    }

    await milestone.save()

    return res.json({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      order_index: milestone.order_index,
      due_date: milestone.due_date,
      completed_at: milestone.completed_at,
    })
  } catch (error) {
    return next(error)
  }
})

// DELETE /api/projects/:id/milestones/:mid — lead-only deletion
router.delete('/:id/milestones/:mid', requireAuth, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id)
    if (!project) return res.status(404).json({ detail: 'Project not found.' })
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the project lead can delete milestones.' })
    }

    const milestone = await Milestone.findOne({
      where: { id: req.params.mid, project_id: project.id },
    })
    if (!milestone) return res.status(404).json({ detail: 'Milestone not found.' })

    await milestone.destroy()
    return res.json({ message: 'Milestone deleted.' })
  } catch (error) {
    return next(error)
  }
})

// ─── Delete Project ───────────────────────────────────────────

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
      // Remove milestones
      await Milestone.destroy({ where: { project_id: project.id }, transaction: t })
      // Remove members
      await ProjectMember.destroy({ where: { project_id: project.id }, transaction: t })
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

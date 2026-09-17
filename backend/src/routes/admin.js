const express = require('express')
const { Op, Sequelize } = require('sequelize')
const { sequelize, Project, User, Skill, Application, ProjectMember, Milestone, Notification, TaskComment } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { ManageGuard, checkProjectLead } = require('../middleware/adminAuth')
const { serializeProject } = require('../utils/serializers')
const { notifyProjectApplication } = require('../services/notificationService')

const router = express.Router({ mergeParams: true })

// ─── Admin Hub API ──────────────────────────────────────────────────

router.get('/', requireAuth, ManageGuard, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const projects = await Project.findAll({
      where: { owner_id: userId },
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url'] },
        { model: ProjectMember, as: 'members' },
      ],
      order: [['created_at', 'DESC']],
    });

    // We need to calculate applicant counts and alert status for each project
    const result = await Promise.all(projects.map(async (project) => {
      const pendingApps = await Application.count({
        where: { project_id: project.id, status: 'PENDING' },
      });

      const hasBlockedTasks = await Milestone.findOne({
        where: { project_id: project.id, status: 'BLOCKED' },
      });

      const hasReviewRequests = await Milestone.findOne({
        where: { project_id: project.id, status: 'READY_FOR_REVIEW' },
      });

      const memberCount = await ProjectMember.count({
        where: { project_id: project.id, status: 'ACTIVE' },
      });

      return {
        ...serializeProject(project),
        applicant_count: pendingApps,
        member_count: memberCount,
        has_alerts: !!(hasBlockedTasks || hasReviewRequests || pendingApps > 0),
      };
    }));

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// ─── Attention API ──────────────────────────────────────────────────

router.get('/attention', requireAuth, ManageGuard, checkProjectLead, async (req, res, next) => {
  try {
    // The :id parameter comes from the mount path: /api/projects/:id/manage
    const projectId = req.params.id;

    // 1. Pending Applications
    const pendingApps = await Application.findAll({
      where: {
        project_id: projectId,
        status: 'PENDING',
      },
      include: [{ model: User, as: 'applicant', attributes: ['id', 'full_name', 'avatar_url'] }],
    });

    // 2. Blocked Tasks (Milestones)
    const blockedTasks = await Milestone.findAll({
      where: {
        project_id: projectId,
        status: 'BLOCKED',
      },
    });

    // 3. Review Requests (Milestones)
    const reviewTasks = await Milestone.findAll({
      where: {
        project_id: projectId,
        status: 'READY_FOR_REVIEW',
      },
    });

    // Transform into the flat array format expected by the frontend
    const alerts = [];

    if (pendingApps.length > 0) {
      alerts.push({
        type: 'APPLICATION',
        count: pendingApps.length,
        message: `${pendingApps.length} new applicants are waiting for your review.`,
        action_url: `/projects/${projectId}/manage/applications`,
      });
    }

    if (blockedTasks.length > 0) {
      alerts.push({
        type: 'TASK',
        count: blockedTasks.length,
        message: `${blockedTasks.length} tasks are currently blocked and need your intervention.`,
        action_url: `/projects/${projectId}/manage/tasks`,
      });
    }

    if (reviewTasks.length > 0) {
      alerts.push({
        type: 'REVIEW',
        count: reviewTasks.length,
        message: `${reviewTasks.length} member updates are ready for your final approval.`,
        action_url: `/projects/${projectId}/manage/tasks`,
      });
    }

    const project = await Project.findByPk(projectId);

    return res.json({
      project: project ? serializeProject(project) : { id: projectId, title: 'Project' },
      alerts,
      summary: {
        total_urgent: alerts.length,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// ─── Task Management ──────────────────────────────────────────────────

router.post('/tasks', requireAuth, ManageGuard, checkProjectLead, async (req, res, next) => {
  try {
    // The :id parameter comes from the mount path: /api/projects/:id/manage
    const projectId = req.params.id;
    const { title, description, priority } = req.body || {};

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found.' });
    }

    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) {
      return res.status(400).json({ detail: 'Task title is required.' });
    }

    const trimmedPriority = String(priority || '').trim().toUpperCase();
    if (trimmedPriority && !['LOW', 'MEDIUM', 'HIGH'].includes(trimmedPriority)) {
      return res.status(400).json({ detail: 'Priority must be LOW, MEDIUM, or HIGH.' });
    }

    // Auto-increment order_index
    const maxOrder = await Milestone.max('order_index', { where: { project_id: projectId } });
    const nextOrder = (maxOrder ?? -1) + 1;

    const milestone = await Milestone.create({
      project_id: projectId,
      title: trimmedTitle,
      description: description ? String(description).trim() : null,
      priority: trimmedPriority || 'MEDIUM',
      order_index: nextOrder,
      created_by: req.user.id,
      status: 'NOT_STARTED',
    });

    return res.status(201).json({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      priority: milestone.priority,
      status: milestone.status,
      order_index: milestone.order_index,
      created_by: req.user.id,
      created_at: milestone.created_at || milestone.createdAt,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/tasks/:taskId/review', requireAuth, ManageGuard, checkProjectLead, async (req, res, next) => {
  try {
    // The :id parameter comes from the mount path: /api/projects/:id/manage
    const projectId = req.params.id;
    const { taskId } = req.params;
    const { decision, feedback } = req.body || {};

    if (!decision || !['APPROVE', 'REQUEST_CHANGES'].includes(decision)) {
      return res.status(400).json({ detail: 'Decision must be either APPROVE or REQUEST_CHANGES.' });
    }

    const milestone = await Milestone.findOne({
      where: { id: taskId, project_id: projectId },
    });

    if (!milestone) {
      return res.status(404).json({ detail: 'Task not found in this project.' });
    }

    if (milestone.status !== 'READY_FOR_REVIEW') {
      return res.status(400).json({ detail: 'Only tasks ready for review can be reviewed.' });
    }

    await sequelize.transaction(async (t) => {
      if (decision === 'APPROVE') {
        await milestone.update({
          status: 'COMPLETED',
          completed_at: new Date(),
        }, { transaction: t });
      } else if (decision === 'REQUEST_CHANGES') {
        if (!feedback) {
          throw new Error('Feedback is required when requesting changes.');
        }
        await milestone.update({ status: 'IN_PROGRESS' }, { transaction: t });

        await TaskComment.create({
          milestone_id: milestone.id,
          user_id: req.user.id,
          content: feedback,
          type: 'comment',
        }, { transaction: t });
      }
    });

    return res.json({ message: `Task ${decision === 'APPROVE' ? 'approved' : 'returned for changes'}.` });
  } catch (error) {
    if (error.message === 'Feedback is required when requesting changes.') {
      return res.status(400).json({ detail: error.message });
    }
    return next(error);
  }
});

// ─── Recruiting pipeline ───────────────────────────────────────────────

router.post('/applicants/:appId/action', requireAuth, checkProjectLead, async (req, res, next) => {
  try {
    // The :id parameter comes from the mount path: /api/projects/:id/manage
    const projectId = req.params.id;
    const { appId } = req.params;
    const { action, role } = req.body;

    if (!['ACCEPT', 'REJECT', 'SHORTLIST'].includes(action)) {
      return res.status(400).json({ detail: 'Invalid action. Must be ACCEPT, REJECT, or SHORTLIST.' });
    }

    const application = await Application.findOne({
      where: { id: appId, project_id: projectId }
    });

    if (!application) {
      return res.status(404).json({ detail: 'Application not found for this project.' });
    }

    if (application.status !== 'PENDING' && application.status !== 'SHORTLISTED') {
      return res.status(409).json({ detail: 'Only pending or shortlisted applications can be processed.' });
    }

    if (action === 'ACCEPT') {
      const roleTitle = String(role || 'Team Member').trim();

      await sequelize.transaction(async (t) => {
        // 1. Update Application status
        await application.update({ status: 'ACCEPTED' }, { transaction: t });

        // 2. Create ProjectMember
        await ProjectMember.create({
          project_id: projectId,
          user_id: application.user_id,
          role: roleTitle,
          role_category: 'OTHER', // Default to OTHER, can be refined
          is_lead: false,
          status: 'ACTIVE',
        }, { transaction: t });

        // 3. Increment filled_count in Project.open_roles
        const project = await Project.findByPk(projectId, { transaction: t });
        if (project && project.open_roles) {
          const roles = project.open_roles.map(r => ({ ...r }));
          const roleIdx = roles.findIndex(r => r.role === roleTitle);
          if (roleIdx !== -1) {
            roles[roleIdx].filled_count = (roles[roleIdx].filled_count || 0) + 1;
            await project.update({ open_roles: roles }, { transaction: t });
          }
        }
      });

      // Notify the user
      const { createNotification } = require('../services/notificationService')
      await createNotification({
        recipientId: application.user_id,
        actorId: req.user.id,
        type: 'MEMBER_ROLE_ASSIGNED',
        message: `You've been accepted to the project as ${roleTitle}!`,
        projectId: projectId,
      }).catch(() => {});
    } else if (action === 'REJECT') {
      await application.update({ status: 'REJECTED' });
    } else if (action === 'SHORTLIST') {
      await application.update({ status: 'SHORTLISTED' });
    }

    return res.json({
      message: `Applicant ${action === 'ACCEPT' ? 'accepted' : action === 'REJECT' ? 'rejected' : 'shortlisted'} successfully.`,
      status: application.status
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router
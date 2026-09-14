const { Project, ProjectMember } = require('../models');

/**
 * Middleware to verify if the authenticated user is a founder (owns at least one project).
 */
async function FounderGuard(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ detail: 'Authentication required.' });
  }

  try {
    // Check if user is an owner of any project
    const isOwner = await Project.findOne({
      where: { owner_id: userId },
    });

    if (isOwner) {
      return next();
    }

    // Check if user is a lead of any project
    const isLead = await ProjectMember.findOne({
      where: {
        user_id: userId,
        is_lead: true,
        status: 'ACTIVE',
      },
    });

    if (isLead) {
      return next();
    }

    return res.status(403).json({ detail: 'Access denied. Only founders can access this resource.' });
  } catch (error) {
    console.error(`[FounderGuard Error]: ${error.message}`);
    return res.status(500).json({ detail: 'Internal server error while verifying founder status.' });
  }
}

/**
 * Middleware to verify if the authenticated user is the project owner or a project lead.
 * Expected to be used on routes that include a projectId parameter.
 */
async function checkProjectLead(req, res, next) {
  const { projectId } = req.params;
  const userId = req.user?.id;

  if (!projectId || !userId) {
    return res.status(400).json({ detail: 'Project ID and User ID are required.' });
  }

  try {
    // 1. Check if user is the project owner
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(403).json({ detail: 'Project not found or access denied.' });
    }

    if (project.owner_id === userId) {
      return next();
    }

    // 2. Check if user is a project lead
    const isLead = await ProjectMember.findOne({
      where: {
        project_id: projectId,
        user_id: userId,
        is_lead: true,
        status: 'ACTIVE',
      },
    });

    if (isLead) {
      return next();
    }

    // 3. Not owner or lead
    return res.status(403).json({ detail: 'Access denied. You must be the project owner or a project lead.' });
  } catch (error) {
    console.error(`[checkProjectLead Error]: ${error.message}`);
    return res.status(500).json({ detail: 'Internal server error while verifying project permissions.' });
  }
}

module.exports = {
  FounderGuard,
  checkProjectLead,
};

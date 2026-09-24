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
    // Check if user is an active member of any project (including owners and leads)
    const isMember = await ProjectMember.findOne({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
    });

    if (isMember) {
      return next();
    }

    // Check if user is an owner of any project (in case they aren't in ProjectMember yet)
    const isOwner = await Project.findOne({
      where: { owner_id: userId },
    });

    if (isOwner) {
      return next();
    }

    return res.status(403).json({ detail: 'Access denied. Only project members or owners can access this resource.' });
  } catch (error) {
    console.error(`[FounderGuard Error]: ${error.message}`);
    return res.status(500).json({ detail: 'Internal server error while verifying member status.' });
  }
}

async function checkProjectMember(req, res, next) {
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

    // 2. Check if user is an active member of the project
    const isMember = await ProjectMember.findOne({
      where: {
        project_id: projectId,
        user_id: userId,
        status: 'ACTIVE',
      },
    });

    if (isMember) {
      return next();
    }

    return res.status(403).json({ detail: 'Access denied. You must be a member of this project.' });
  } catch (error) {
    console.error(`[checkProjectMember Error]: ${error.message}`);
    return res.status(500).json({ detail: 'Internal server error while verifying project membership.' });
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
  checkProjectMember,
  checkProjectLead,
};

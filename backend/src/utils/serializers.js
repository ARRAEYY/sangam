function normalizeSkill(skill) {
  if (!skill) return null
  if (typeof skill === 'string') {
    return { id: null, name: skill.trim() }
  }
  return { id: skill.id, name: skill.name }
}

function serializeSkills(skills = []) {
  return skills.map(normalizeSkill).filter(Boolean)
}

function serializeUser(user) {
  if (!user) return null

  const plain = user.toJSON ? user.toJSON() : user
  const { password_hash, google_id, createdAt, updatedAt, ...safeUser } = plain

  return {
    ...safeUser,
    id: safeUser.id,
    email: safeUser.email,
    full_name: safeUser.full_name,
    branch: safeUser.branch,
    graduation_year: safeUser.graduation_year,
    headline: safeUser.headline || null,
    location: safeUser.location || null,
    bio: safeUser.bio || null,
    avatar_url: safeUser.avatar_url || null,
    auth_provider: safeUser.auth_provider || 'LOCAL',
    github_url: safeUser.github_url || null,
    linkedin_url: safeUser.linkedin_url || null,
    portfolio_url: safeUser.portfolio_url || null,
    leetcode_url: safeUser.leetcode_url || null,
    codeforces_url: safeUser.codeforces_url || null,
    skills: serializeSkills(safeUser.skills || []),
  }
}

function serializeNotification(notification) {
  if (!notification) return null
  const plain = notification.toJSON ? notification.toJSON() : notification

  return {
    id: plain.id,
    type: plain.type,
    message: plain.message,
    is_read: plain.is_read,
    created_at: plain.created_at || plain.createdAt,
    project: plain.project ? { id: plain.project.id, title: plain.project.title } : null,
    actor: plain.actor
      ? { id: plain.actor.id, full_name: plain.actor.full_name, avatar_url: plain.actor.avatar_url || null }
      : null,
    connection_request_id: plain.connection_request_id || null,
  }
}

function serializeConnectionRequest(connectionRequest) {
  if (!connectionRequest) return null
  const plain = connectionRequest.toJSON ? connectionRequest.toJSON() : connectionRequest

  return {
    id: plain.id,
    status: plain.status,
    message: plain.message || null,
    created_at: plain.created_at || plain.createdAt,
    requester: plain.requester ? serializeUser(plain.requester) : null,
    recipient: plain.recipient ? serializeUser(plain.recipient) : null,
  }
}

function serializeProject(project) {
  if (!project) return null

  const plain = project.toJSON ? project.toJSON() : project
  const { createdAt, updatedAt, ...safeProject } = plain

  return {
    id: safeProject.id,
    title: safeProject.title,
    description: safeProject.description,
    status: safeProject.status,
    team_size_needed: safeProject.team_size_needed,
    created_at: safeProject.created_at || safeProject.createdAt,
    owner: safeProject.owner
      ? {
          id: safeProject.owner.id,
          full_name: safeProject.owner.full_name,
        }
      : safeProject.owner_id
        ? { id: safeProject.owner_id, full_name: safeProject.owner_name || null }
        : null,
    required_skills: serializeSkills(safeProject.required_skills || []),
  }
}

function serializeApplication(application) {
  if (!application) return null

  const plain = application.toJSON ? application.toJSON() : application
  const { createdAt, updatedAt, ...safeApplication } = plain

  return {
    id: safeApplication.id,
    project_id: safeApplication.project_id,
    pitch_message: safeApplication.pitch_message,
    status: safeApplication.status,
    applied_at:
      safeApplication.applied_at ||
      safeApplication.appliedAt ||
      safeApplication.created_at ||
      safeApplication.createdAt,
    applicant: safeApplication.applicant ? serializeUser(safeApplication.applicant) : null,
    project: safeApplication.project ? serializeProject(safeApplication.project) : null,
  }
}

module.exports = {
  serializeUser,
  serializeProject,
  serializeApplication,
  serializeSkills,
  serializeNotification,
  serializeConnectionRequest,
}

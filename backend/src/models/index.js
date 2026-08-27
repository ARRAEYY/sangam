const sequelize = require('../config/database')
const User = require('./User')
const Skill = require('./Skill')
const Project = require('./Project')
const Application = require('./Application')
const UserSkill = require('./UserSkill')
const ProjectSkill = require('./ProjectSkill')
const Notification = require('./Notification')
const ConnectionRequest = require('./ConnectionRequest')
const Connection = require('./Connection')
const Experience = require('./Experience')
const Education = require('./Education')
const Achievement = require('./Achievement')
const ProjectMember = require('./ProjectMember')
const Milestone = require('./Milestone')
const RefreshToken = require('./RefreshToken')

User.belongsToMany(Skill, {
  through: UserSkill,
  foreignKey: 'user_id',
  otherKey: 'skill_id',
  as: 'skills',
})

Skill.belongsToMany(User, {
  through: UserSkill,
  foreignKey: 'skill_id',
  otherKey: 'user_id',
  as: 'users',
})

Project.belongsToMany(Skill, {
  through: ProjectSkill,
  foreignKey: 'project_id',
  otherKey: 'skill_id',
  as: 'required_skills',
})

Skill.belongsToMany(Project, {
  through: ProjectSkill,
  foreignKey: 'skill_id',
  otherKey: 'project_id',
  as: 'projects',
})

User.hasMany(Project, {
  foreignKey: 'owner_id',
  as: 'projects',
})

Project.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
})

Project.hasMany(Application, {
  foreignKey: 'project_id',
  as: 'applications',
})

Application.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
})

User.hasMany(Application, {
  foreignKey: 'user_id',
  as: 'applications',
})

Application.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'applicant',
})

// Notifications
User.hasMany(Notification, { foreignKey: 'recipient_id', as: 'notifications' })
Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' })
Notification.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' })
Notification.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })
Notification.belongsTo(ConnectionRequest, { foreignKey: 'connection_request_id', as: 'connection_request' })

// Connection requests
User.hasMany(ConnectionRequest, { foreignKey: 'requester_id', as: 'sent_connection_requests' })
User.hasMany(ConnectionRequest, { foreignKey: 'recipient_id', as: 'received_connection_requests' })
ConnectionRequest.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' })
ConnectionRequest.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' })

// Established connections
Connection.belongsTo(User, { foreignKey: 'user_a_id', as: 'userA' })
Connection.belongsTo(User, { foreignKey: 'user_b_id', as: 'userB' })

// Portfolio: experience / education / achievements
User.hasMany(Experience, { foreignKey: 'user_id', as: 'experiences' })
Experience.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(Education, { foreignKey: 'user_id', as: 'educations' })
Education.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(Achievement, { foreignKey: 'user_id', as: 'achievements' })
Achievement.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// Refresh Tokens
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' })
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// ─── Team Membership ──────────────────────────────────────────
Project.hasMany(ProjectMember, { foreignKey: 'project_id', as: 'members' })
ProjectMember.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

User.hasMany(ProjectMember, { foreignKey: 'user_id', as: 'memberships' })
ProjectMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// ─── Milestones ───────────────────────────────────────────────
Project.hasMany(Milestone, { foreignKey: 'project_id', as: 'milestones' })
Milestone.belongsTo(Project, { foreignKey: 'project_id', as: 'project' })

User.hasMany(Milestone, { foreignKey: 'created_by', as: 'created_milestones' })
Milestone.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })

module.exports = {
  sequelize,
  User,
  Skill,
  Project,
  Application,
  UserSkill,
  ProjectSkill,
  Notification,
  ConnectionRequest,
  Connection,
  Experience,
  Education,
  Achievement,
  ProjectMember,
  Milestone,
  RefreshToken,
}

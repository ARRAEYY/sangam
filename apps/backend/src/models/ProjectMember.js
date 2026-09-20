const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ROLE_CATEGORIES = [
  'FRONTEND',
  'BACKEND',
  'FULLSTACK',
  'DESIGN',
  'PRODUCT',
  'DATA',
  'DEVOPS',
  'CONTENT',
  'MARKETING',
  'RESEARCH',
  'LEAD',
  'OTHER',
]

const MEMBER_STATUSES = ['ACTIVE', 'REMOVED', 'LEFT']

const ProjectMember = sequelize.define(
  'ProjectMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role_category: {
      type: DataTypes.ENUM(...ROLE_CATEGORIES),
      allowNull: false,
      defaultValue: 'OTHER',
    },
    is_lead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM(...MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'project_members',
    indexes: [
      { unique: true, fields: ['project_id', 'user_id'] },
      { fields: ['user_id', 'status'] },
    ],
  }
)

ProjectMember.ROLE_CATEGORIES = ROLE_CATEGORIES
ProjectMember.MEMBER_STATUSES = MEMBER_STATUSES

module.exports = ProjectMember

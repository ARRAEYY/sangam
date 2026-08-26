const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const MILESTONE_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']

const Milestone = sequelize.define(
  'Milestone',
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...MILESTONE_STATUSES),
      allowNull: false,
      defaultValue: 'NOT_STARTED',
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    tableName: 'milestones',
    indexes: [
      { fields: ['project_id', 'order_index'] },
    ],
  }
)

Milestone.STATUSES = MILESTONE_STATUSES

module.exports = Milestone

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const TaskComment = sequelize.define(
  'TaskComment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    milestone_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'milestones', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('comment', 'feedback'),
      allowNull: false,
      defaultValue: 'comment',
    },
  },
  {
    tableName: 'task_comments',
  }
)

module.exports = TaskComment

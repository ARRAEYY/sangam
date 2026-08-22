const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const NOTIFICATION_TYPES = [
  'PROJECT_APPLICATION',
  'APPLICATION_ACCEPTED',
  'APPLICATION_REJECTED',
  'CONNECTION_REQUEST',
  'CONNECTION_ACCEPTED',
  'CONNECTION_REJECTED',
  'PROJECT_UPDATE',
]

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM(...NOTIFICATION_TYPES),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
    },
    connection_request_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'connection_requests', key: 'id' },
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'notifications',
    indexes: [
      { fields: ['recipient_id', 'is_read'] },
      { fields: ['recipient_id', 'created_at'] },
    ],
  }
)

Notification.TYPES = NOTIFICATION_TYPES

module.exports = Notification

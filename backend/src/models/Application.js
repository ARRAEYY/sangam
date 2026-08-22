const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Application = sequelize.define(
  'Application',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    pitch_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    tableName: 'applications',
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'user_id'],
      },
    ],
  }
)

module.exports = Application

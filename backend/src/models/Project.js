const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Project = sequelize.define(
  'Project',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    short_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    looking_for: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expectations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tech_stack: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    time_horizon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    open_roles: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    team_size_needed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'OPEN',
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'projects',
  }
)

module.exports = Project

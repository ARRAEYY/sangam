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
    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    project_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isHttpUrlOrEmpty(value) {
          if (value === null || value === '' || value === undefined) return
          try {
            const parsed = new URL(value)
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('bad scheme')
          } catch {
            throw new Error('Project URL must be a valid http(s) URL.')
          }
        },
      },
    },
    visibility: {
      type: DataTypes.ENUM('Public', 'Private'),
      allowNull: false,
      defaultValue: 'Public',
    },
    hiring_requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    short_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tech_stack: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Other',
    },
    looking_for: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expectations: {
      type: DataTypes.TEXT,
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
    property_schema: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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

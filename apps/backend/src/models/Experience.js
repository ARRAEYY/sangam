const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Experience = sequelize.define(
  'Experience',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    work_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'On-site',
    },
    employment_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Full-time',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // null = "present"
    },
  },
  {
    tableName: 'experiences',
    indexes: [{ fields: ['user_id'] }],
  }
)

module.exports = Experience

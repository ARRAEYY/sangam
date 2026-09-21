const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ACHIEVEMENT_TYPES = ['HACKATHON', 'CERTIFICATION', 'AWARD', 'COMPETITION', 'OTHER']

const Achievement = sequelize.define(
  'Achievement',
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
    type: {
      type: DataTypes.ENUM(...ACHIEVEMENT_TYPES),
      allowNull: false,
      defaultValue: 'OTHER',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issuer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_awarded: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'achievements',
    indexes: [{ fields: ['user_id'] }],
  }
)

Achievement.TYPES = ACHIEVEMENT_TYPES

module.exports = Achievement

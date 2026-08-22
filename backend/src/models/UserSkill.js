const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const UserSkill = sequelize.define(
  'UserSkill',
  {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    skill_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id',
      },
    },
  },
  {
    tableName: 'user_skills',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'skill_id'],
      },
    ],
  }
)

module.exports = UserSkill

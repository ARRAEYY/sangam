const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ProjectSkill = sequelize.define(
  'ProjectSkill',
  {
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
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
    tableName: 'project_skills',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'skill_id'],
      },
    ],
  }
)

module.exports = ProjectSkill

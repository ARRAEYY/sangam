const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Skill = sequelize.define(
  'Skill',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        // Store skills canonically lowercase so case-variant duplicates
        // ("React" vs "react") can never be created (AUD-036).
        this.setDataValue('name', String(value).trim().toLowerCase())
      },
    },
  },
  {
    tableName: 'skills',
  }
)

module.exports = Skill

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
        this.setDataValue('name', value.trim())
      },
    },
  },
  {
    tableName: 'skills',
  }
)

module.exports = Skill

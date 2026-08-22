const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Education = sequelize.define(
  'Education',
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
    institution: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'educations',
    indexes: [{ fields: ['user_id'] }],
  }
)

module.exports = Education

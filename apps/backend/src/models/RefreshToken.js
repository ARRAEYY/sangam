const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    tableName: 'refresh_tokens',
  }
)

module.exports = RefreshToken

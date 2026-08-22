const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// A Connection row always stores user_a_id < user_b_id (lexicographically) so
// that the pair is unique regardless of who initiated the request.
const Connection = sequelize.define(
  'Connection',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_a_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    user_b_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    tableName: 'connections',
    indexes: [
      {
        unique: true,
        fields: ['user_a_id', 'user_b_id'],
      },
    ],
  }
)

module.exports = Connection

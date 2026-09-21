const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ConnectionRequest = sequelize.define(
  'ConnectionRequest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requester_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'connection_requests',
    indexes: [
      {
        // Prevent more than one PENDING request between the same pair at once
        // (enforced additionally in application logic for direction-independence).
        fields: ['requester_id', 'recipient_id'],
      },
    ],
  }
)

module.exports = ConnectionRequest

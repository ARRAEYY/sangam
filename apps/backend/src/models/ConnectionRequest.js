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
      // Non-unique lookup index for the common requester/recipient queries
      {
        fields: ['requester_id', 'recipient_id'],
      },
      // DB-enforced invariant (AUD-036): at most one PENDING request per pair.
      // The unique violation surfaces as SequelizeUniqueConstraintError, which
      // POST /requests maps to a 409.
      {
        unique: true,
        name: 'connection_requests_unique_pending_per_pair',
        fields: ['requester_id', 'recipient_id'],
        where: { status: 'PENDING' },
      },
    ],
  }
)

module.exports = ConnectionRequest

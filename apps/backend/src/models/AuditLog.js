const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// Append-only audit trail for sensitive actions (issue #54). Rows are written
// via utils/auditLogger.logAudit and never deleted by application code.
// actor_id is deliberately a plain column with no FK constraint — the trail
// must survive the actor's account being deleted.

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actor_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    actor_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
    updatedAt: false,
    indexes: [
      { fields: ['actor_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] },
    ],
  }
)

module.exports = AuditLog

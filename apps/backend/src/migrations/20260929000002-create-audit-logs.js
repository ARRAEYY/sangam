'use strict'

// AUD-010 / issue #54 — append-only audit_logs table for sensitive actions.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      actor_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
      },
      actor_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      entity_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    await queryInterface.addIndex('audit_logs', { fields: ['actor_id'], name: 'audit_logs_actor_id_idx' })
    await queryInterface.addIndex('audit_logs', { fields: ['entity_type', 'entity_id'], name: 'audit_logs_entity_idx' })
    await queryInterface.addIndex('audit_logs', { fields: ['created_at'], name: 'audit_logs_created_at_idx' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs')
  },
}

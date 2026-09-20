'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'PROJECT_APPLICATION',
          'APPLICATION_ACCEPTED',
          'APPLICATION_REJECTED',
          'CONNECTION_REQUEST',
          'CONNECTION_ACCEPTED',
          'CONNECTION_REJECTED',
          'PROJECT_UPDATE'
        ),
        allowNull: false,
      },
      message: { type: Sequelize.STRING, allowNull: false },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      connection_request_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'connection_requests', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('notifications', ['recipient_id', 'is_read'])
    await queryInterface.addIndex('notifications', ['recipient_id', 'created_at'])
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications')
  },
}

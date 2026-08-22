'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('connection_requests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      requester_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: { type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'DECLINED'), allowNull: false, defaultValue: 'PENDING' },
      message: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('connection_requests', ['requester_id', 'recipient_id'])
  },
  async down(queryInterface) {
    await queryInterface.dropTable('connection_requests')
  },
}

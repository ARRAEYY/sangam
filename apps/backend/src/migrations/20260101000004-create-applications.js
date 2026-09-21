'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      pitch_message: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'), allowNull: false, defaultValue: 'PENDING' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('applications', ['project_id', 'user_id'], { unique: true, name: 'applications_project_user_unique' })
  },
  async down(queryInterface) {
    await queryInterface.dropTable('applications')
  },
}

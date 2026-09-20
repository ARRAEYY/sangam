'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      team_size_needed: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: { type: Sequelize.ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED'), allowNull: false, defaultValue: 'OPEN' },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('projects', ['owner_id'])
  },
  async down(queryInterface) {
    await queryInterface.dropTable('projects')
  },
}

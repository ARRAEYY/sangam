'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('educations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      institution: { type: Sequelize.STRING, allowNull: false },
      degree: { type: Sequelize.STRING, allowNull: false },
      department: { type: Sequelize.STRING, allowNull: true },
      start_year: { type: Sequelize.INTEGER, allowNull: false },
      graduation_year: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('educations', ['user_id'])
  },
  async down(queryInterface) {
    await queryInterface.dropTable('educations')
  },
}

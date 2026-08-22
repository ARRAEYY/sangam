'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_skills', {
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'skills', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('user_skills', ['user_id', 'skill_id'], { unique: true, name: 'user_skills_unique' })
  },
  async down(queryInterface) {
    await queryInterface.dropTable('user_skills')
  },
}

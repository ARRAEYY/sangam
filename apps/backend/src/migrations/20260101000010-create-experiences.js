'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('experiences', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      organization: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    try {
      await queryInterface.addIndex('experiences', ['user_id'])
    } catch (err) {
      if (err.name === 'SequelizeDatabaseError' && err.message.includes('already exists')) {
        console.log('Index already exists, skipping...');
      } else {
        throw err;
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.dropTable('experiences')
  },
}

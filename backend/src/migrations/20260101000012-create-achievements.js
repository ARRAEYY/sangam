'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('achievements', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: { type: Sequelize.ENUM('HACKATHON', 'CERTIFICATION', 'AWARD', 'COMPETITION', 'OTHER'), allowNull: false, defaultValue: 'OTHER' },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      issuer: { type: Sequelize.STRING, allowNull: true },
      date_awarded: { type: Sequelize.DATEONLY, allowNull: true },
      url: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('achievements', ['user_id'])
  },
  async down(queryInterface) {
    await queryInterface.dropTable('achievements')
  },
}

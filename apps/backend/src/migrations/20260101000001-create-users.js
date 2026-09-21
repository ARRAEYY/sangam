'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: true },
      google_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      auth_provider: { type: Sequelize.ENUM('LOCAL', 'GOOGLE'), allowNull: false, defaultValue: 'LOCAL' },
      avatar_url: { type: Sequelize.TEXT, allowNull: true },
      full_name: { type: Sequelize.STRING, allowNull: false },
      branch: { type: Sequelize.STRING, allowNull: false },
      graduation_year: { type: Sequelize.INTEGER, allowNull: false },
      headline: { type: Sequelize.STRING, allowNull: true },
      location: { type: Sequelize.STRING, allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      github_url: { type: Sequelize.TEXT, allowNull: true },
      linkedin_url: { type: Sequelize.TEXT, allowNull: true },
      portfolio_url: { type: Sequelize.TEXT, allowNull: true },
      leetcode_url: { type: Sequelize.TEXT, allowNull: true },
      codeforces_url: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique' })
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users')
  },
}

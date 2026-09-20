'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users')
    if (!tableInfo.email_verified) {
      await queryInterface.addColumn('users', 'email_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      })
      await queryInterface.sequelize.query('UPDATE users SET email_verified = true WHERE email_verified IS NULL;')
    }
    if (!tableInfo.email_verification_token) {
      await queryInterface.addColumn('users', 'email_verification_token', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('users')
    if (tableInfo.email_verified) {
      await queryInterface.removeColumn('users', 'email_verified')
    }
    if (tableInfo.email_verification_token) {
      await queryInterface.removeColumn('users', 'email_verification_token')
    }
  },
}

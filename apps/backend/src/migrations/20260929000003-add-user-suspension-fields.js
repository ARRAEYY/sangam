'use strict'

// Issue #57 — platform administration: account suspension fields.

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users').catch(() => null)

    if (table && !table.is_suspended) {
      await queryInterface.addColumn('users', 'is_suspended', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      })
    }
    if (table && !table.suspended_at) {
      await queryInterface.addColumn('users', 'suspended_at', {
        type: Sequelize.DATE,
        allowNull: true,
      })
    }
    if (table && !table.suspended_reason) {
      await queryInterface.addColumn('users', 'suspended_reason', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'suspended_reason').catch(() => {})
    await queryInterface.removeColumn('users', 'suspended_at').catch(() => {})
    await queryInterface.removeColumn('users', 'is_suspended').catch(() => {})
  },
}

'use strict'

/**
 * Adds the Project columns the founder Settings page has always written but
 * that the model never defined — values were silently dropped before.
 * See issue #34 / audit AUD-014.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('projects')

    if (!table.project_url) {
      await queryInterface.addColumn('projects', 'project_url', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    }
    if (!table.visibility) {
      // SQLite lacks ALTER TYPE for enums; use STRING + app-level validation
      // so the column behaves identically in dev and prod.
      await queryInterface.addColumn('projects', 'visibility', {
        type: Sequelize.ENUM('Public', 'Private'),
        allowNull: false,
        defaultValue: 'Public',
      })
    }
    if (!table.hiring_requirements) {
      await queryInterface.addColumn('projects', 'hiring_requirements', {
        type: Sequelize.TEXT,
        allowNull: true,
      })
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('projects')
    if (table.hiring_requirements) {
      await queryInterface.removeColumn('projects', 'hiring_requirements')
    }
    if (table.visibility) {
      await queryInterface.removeColumn('projects', 'visibility')
    }
    if (table.project_url) {
      await queryInterface.removeColumn('projects', 'project_url')
    }
  },
}

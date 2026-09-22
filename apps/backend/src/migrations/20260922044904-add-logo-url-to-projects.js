'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('projects');
    if (!tableDesc.logo_url) {
      await queryInterface.addColumn('projects', 'logo_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('projects');
    if (tableDesc.logo_url) {
      await queryInterface.removeColumn('projects', 'logo_url');
    }
  }
};

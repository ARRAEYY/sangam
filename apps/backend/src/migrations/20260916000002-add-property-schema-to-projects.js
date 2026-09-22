'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('projects');
    if (!tableDesc.property_schema) {
      await queryInterface.addColumn('projects', 'property_schema', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('projects');
    if (tableDesc.property_schema) {
      await queryInterface.removeColumn('projects', 'property_schema');
    }
  }
};
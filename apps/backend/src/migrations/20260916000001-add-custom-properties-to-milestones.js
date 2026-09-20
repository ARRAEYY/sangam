'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('milestones', 'custom_properties', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addIndex('milestones', ['custom_properties'], {
      type: 'GIN',
      name: 'idx_milestones_custom_properties_gin',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('milestones', 'idx_milestones_custom_properties_gin');
    await queryInterface.removeColumn('milestones', 'custom_properties');
  }
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('projects');
    
    if (!tableDesc.short_description) {
      await queryInterface.addColumn('projects', 'short_description', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!tableDesc.tech_stack) {
      await queryInterface.addColumn('projects', 'tech_stack', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!tableDesc.category) {
      await queryInterface.addColumn('projects', 'category', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Other',
      });
    }

    if (!tableDesc.looking_for) {
      await queryInterface.addColumn('projects', 'looking_for', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDesc.expectations) {
      await queryInterface.addColumn('projects', 'expectations', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableDesc.time_horizon) {
      await queryInterface.addColumn('projects', 'time_horizon', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDesc.open_roles) {
      await queryInterface.addColumn('projects', 'open_roles', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('projects');
    
    if (tableDesc.open_roles) await queryInterface.removeColumn('projects', 'open_roles');
    if (tableDesc.time_horizon) await queryInterface.removeColumn('projects', 'time_horizon');
    if (tableDesc.expectations) await queryInterface.removeColumn('projects', 'expectations');
    if (tableDesc.looking_for) await queryInterface.removeColumn('projects', 'looking_for');
    if (tableDesc.category) await queryInterface.removeColumn('projects', 'category');
    if (tableDesc.tech_stack) await queryInterface.removeColumn('projects', 'tech_stack');
    if (tableDesc.short_description) await queryInterface.removeColumn('projects', 'short_description');
  }
};

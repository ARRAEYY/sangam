'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('projects', 'short_description', { type: Sequelize.STRING(500), allowNull: true }, { transaction });
      await queryInterface.addColumn('projects', 'tech_stack', { type: Sequelize.JSON, allowNull: true }, { transaction });
      await queryInterface.addColumn('projects', 'category', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Other' }, { transaction });
      await queryInterface.addColumn('projects', 'looking_for', { type: Sequelize.STRING, allowNull: true }, { transaction });
      await queryInterface.addColumn('projects', 'expectations', { type: Sequelize.TEXT, allowNull: true }, { transaction });
      await queryInterface.addColumn('projects', 'time_horizon', { type: Sequelize.STRING, allowNull: true }, { transaction });
      await queryInterface.addColumn('projects', 'open_roles', { type: Sequelize.JSON, allowNull: true }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('projects', 'short_description', { transaction });
      await queryInterface.removeColumn('projects', 'tech_stack', { transaction });
      await queryInterface.removeColumn('projects', 'category', { transaction });
      await queryInterface.removeColumn('projects', 'looking_for', { transaction });
      await queryInterface.removeColumn('projects', 'expectations', { transaction });
      await queryInterface.removeColumn('projects', 'time_horizon', { transaction });
      await queryInterface.removeColumn('projects', 'open_roles', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

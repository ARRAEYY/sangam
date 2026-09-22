'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    
    // 1. Projects
    if (tables.includes('projects')) {
      const projDesc = await queryInterface.describeTable('projects');
      if (!projDesc.logo_url) await queryInterface.addColumn('projects', 'logo_url', { type: Sequelize.TEXT, allowNull: true });
      if (!projDesc.short_description) await queryInterface.addColumn('projects', 'short_description', { type: Sequelize.STRING(500), allowNull: true });
      if (!projDesc.tech_stack) await queryInterface.addColumn('projects', 'tech_stack', { type: Sequelize.JSON, allowNull: true });
      if (!projDesc.category) await queryInterface.addColumn('projects', 'category', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Other' });
      if (!projDesc.looking_for) await queryInterface.addColumn('projects', 'looking_for', { type: Sequelize.STRING, allowNull: true });
      if (!projDesc.expectations) await queryInterface.addColumn('projects', 'expectations', { type: Sequelize.TEXT, allowNull: true });
      if (!projDesc.time_horizon) await queryInterface.addColumn('projects', 'time_horizon', { type: Sequelize.STRING, allowNull: true });
      if (!projDesc.open_roles) await queryInterface.addColumn('projects', 'open_roles', { type: Sequelize.JSON, allowNull: true });
      if (!projDesc.property_schema) await queryInterface.addColumn('projects', 'property_schema', { type: Sequelize.JSONB, allowNull: true, defaultValue: {} });
    }

    // 2. Experiences
    if (tables.includes('experiences')) {
      const expDesc = await queryInterface.describeTable('experiences');
      if (!expDesc.location) await queryInterface.addColumn('experiences', 'location', { type: Sequelize.STRING, allowNull: true });
      if (!expDesc.work_type) await queryInterface.addColumn('experiences', 'work_type', { type: Sequelize.STRING, allowNull: true, defaultValue: 'On-site' });
      if (!expDesc.employment_type) await queryInterface.addColumn('experiences', 'employment_type', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Full-time' });
    }

    // 3. Milestones
    if (tables.includes('milestones')) {
      const msDesc = await queryInterface.describeTable('milestones');
      if (!msDesc.custom_properties) {
        await queryInterface.addColumn('milestones', 'custom_properties', { type: Sequelize.JSONB, allowNull: true, defaultValue: {} });
        await queryInterface.addIndex('milestones', ['custom_properties'], { type: 'GIN', name: 'idx_milestones_custom_properties_gin_force' });
      }
    }
    
    // 4. Project Members
    if (tables.includes('project_members')) {
      const pmDesc = await queryInterface.describeTable('project_members');
      if (!pmDesc.left_at) await queryInterface.addColumn('project_members', 'left_at', { type: Sequelize.DATE, allowNull: true });
    }
  },

  async down (queryInterface, Sequelize) {
    // Irreversible but safe idempotent force migration
  }
};

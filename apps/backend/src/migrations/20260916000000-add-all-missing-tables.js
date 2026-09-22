'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    
    // 1. Experiences columns
    if (tables.includes('experiences')) {
      const expDesc = await queryInterface.describeTable('experiences');
      if (!expDesc.location) {
        await queryInterface.addColumn('experiences', 'location', { type: Sequelize.STRING, allowNull: true });
      }
      if (!expDesc.work_type) {
        await queryInterface.addColumn('experiences', 'work_type', { type: Sequelize.STRING, allowNull: true, defaultValue: 'On-site' });
      }
      if (!expDesc.employment_type) {
        await queryInterface.addColumn('experiences', 'employment_type', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Full-time' });
      }
    }

    // 2. Project Members
    if (!tables.includes('project_members')) {
      await queryInterface.createTable('project_members', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        project_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        role: { type: Sequelize.STRING, allowNull: false },
        role_category: { type: Sequelize.ENUM('FRONTEND', 'BACKEND', 'FULLSTACK', 'DESIGN', 'PRODUCT', 'DATA', 'DEVOPS', 'CONTENT', 'MARKETING', 'RESEARCH', 'LEAD', 'OTHER'), allowNull: false, defaultValue: 'OTHER' },
        is_lead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        status: { type: Sequelize.ENUM('ACTIVE', 'REMOVED', 'LEFT'), allowNull: false, defaultValue: 'ACTIVE' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
      await queryInterface.addIndex('project_members', ['project_id', 'user_id'], { unique: true });
      await queryInterface.addIndex('project_members', ['user_id', 'status']);
    }

    // 3. Milestones
    if (!tables.includes('milestones')) {
      await queryInterface.createTable('milestones', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        project_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        title: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.ENUM('NOT_STARTED', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'COMPLETED', 'BLOCKED'), allowNull: false, defaultValue: 'NOT_STARTED' },
        order_index: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        due_date: { type: Sequelize.DATEONLY, allowNull: true },
        completed_at: { type: Sequelize.DATE, allowNull: true },
        priority: { type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH'), allowNull: true, defaultValue: 'MEDIUM' },
        created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
      await queryInterface.addIndex('milestones', ['project_id', 'order_index']);
    }

    // 4. Task Comments
    if (!tables.includes('task_comments')) {
      await queryInterface.createTable('task_comments', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        milestone_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'milestones', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        content: { type: Sequelize.TEXT, allowNull: false },
        type: { type: Sequelize.ENUM('comment', 'feedback'), allowNull: false, defaultValue: 'comment' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    // 5. Refresh Tokens
    if (!tables.includes('refresh_tokens')) {
      await queryInterface.createTable('refresh_tokens', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        token: { type: Sequelize.STRING, allowNull: false, unique: true },
        expires_at: { type: Sequelize.DATE, allowNull: false },
        is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('refresh_tokens')) await queryInterface.dropTable('refresh_tokens');
    if (tables.includes('task_comments')) await queryInterface.dropTable('task_comments');
    if (tables.includes('milestones')) await queryInterface.dropTable('milestones');
    if (tables.includes('project_members')) await queryInterface.dropTable('project_members');
    
    if (tables.includes('experiences')) {
      const expDesc = await queryInterface.describeTable('experiences');
      if (expDesc.location) await queryInterface.removeColumn('experiences', 'location');
      if (expDesc.work_type) await queryInterface.removeColumn('experiences', 'work_type');
      if (expDesc.employment_type) await queryInterface.removeColumn('experiences', 'employment_type');
    }
  }
};

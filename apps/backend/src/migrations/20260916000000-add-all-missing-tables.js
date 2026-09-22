'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add missing columns to experiences
      await queryInterface.addColumn('experiences', 'location', { type: Sequelize.STRING, allowNull: true }, { transaction });
      await queryInterface.addColumn('experiences', 'work_type', { type: Sequelize.STRING, allowNull: true, defaultValue: 'On-site' }, { transaction });
      await queryInterface.addColumn('experiences', 'employment_type', { type: Sequelize.STRING, allowNull: true, defaultValue: 'Full-time' }, { transaction });

      // Create project_members
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
      }, { transaction });

      await queryInterface.addIndex('project_members', ['project_id', 'user_id'], { unique: true, transaction });
      await queryInterface.addIndex('project_members', ['user_id', 'status'], { transaction });

      // Create milestones (Omit custom_properties because the 20260916000001 migration adds it!)
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
      }, { transaction });

      await queryInterface.addIndex('milestones', ['project_id', 'order_index'], { transaction });

      // Create task_comments
      await queryInterface.createTable('task_comments', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        milestone_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'milestones', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        content: { type: Sequelize.TEXT, allowNull: false },
        type: { type: Sequelize.ENUM('comment', 'feedback'), allowNull: false, defaultValue: 'comment' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      }, { transaction });

      // Create refresh_tokens
      await queryInterface.createTable('refresh_tokens', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        token: { type: Sequelize.STRING, allowNull: false, unique: true },
        expires_at: { type: Sequelize.DATE, allowNull: false },
        is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('refresh_tokens', { transaction });
      await queryInterface.dropTable('task_comments', { transaction });
      await queryInterface.dropTable('milestones', { transaction });
      await queryInterface.dropTable('project_members', { transaction });
      await queryInterface.removeColumn('experiences', 'location', { transaction });
      await queryInterface.removeColumn('experiences', 'work_type', { transaction });
      await queryInterface.removeColumn('experiences', 'employment_type', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

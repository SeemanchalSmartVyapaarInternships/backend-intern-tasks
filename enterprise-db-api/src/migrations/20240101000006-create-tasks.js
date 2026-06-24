'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true
      },
      title: {
        type:      Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type:         Sequelize.ENUM('todo', 'in_progress', 'in_review', 'completed', 'cancelled'),
        allowNull:    false,
        defaultValue: 'todo'
      },
      priority: {
        type:         Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull:    false,
        defaultValue: 'medium'
      },
      dueDate: {
        type:      Sequelize.DATEONLY,
        allowNull: true
      },
      estimatedHours: {
        type:         Sequelize.DECIMAL(6, 2),
        allowNull:    true,
        defaultValue: 0.00
      },
      loggedHours: {
        type:         Sequelize.DECIMAL(6, 2),
        allowNull:    false,
        defaultValue: 0.00
      },
      tags: {
        type:         Sequelize.JSON,
        allowNull:    false,
        defaultValue: '[]'
      },
      // FK: Many side of Project → Tasks (required)
      projectId: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE'
      },
      // FK: Optional assignee
      assigneeId: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL'
      },
      createdAt: {
        type:      Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type:      Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('tasks', ['projectId'],  { name: 'idx_tasks_projectId' });
    await queryInterface.addIndex('tasks', ['assigneeId'], { name: 'idx_tasks_assigneeId' });
    await queryInterface.addIndex('tasks', ['status'],     { name: 'idx_tasks_status' });
    await queryInterface.addIndex('tasks', ['priority'],   { name: 'idx_tasks_priority' });
    await queryInterface.addIndex('tasks', ['dueDate'],    { name: 'idx_tasks_dueDate' });
    // Composite indexes for the most common filter combinations
    await queryInterface.addIndex('tasks', ['projectId', 'status'],   { name: 'idx_tasks_project_status' });
    await queryInterface.addIndex('tasks', ['assigneeId', 'status'],  { name: 'idx_tasks_assignee_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tasks');
  }
};

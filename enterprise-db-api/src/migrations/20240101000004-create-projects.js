'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true
      },
      name: {
        type:      Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type:         Sequelize.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
        allowNull:    false,
        defaultValue: 'planning'
      },
      priority: {
        type:         Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull:    false,
        defaultValue: 'medium'
      },
      startDate: {
        type:      Sequelize.DATEONLY,
        allowNull: true
      },
      endDate: {
        type:      Sequelize.DATEONLY,
        allowNull: true
      },
      budget: {
        type:         Sequelize.DECIMAL(15, 2),
        allowNull:    true,
        defaultValue: 0.00
      },
      progress: {
        type:         Sequelize.TINYINT.UNSIGNED,
        allowNull:    false,
        defaultValue: 0
      },
      departmentId: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
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

    await queryInterface.addIndex('projects', ['status'],       { name: 'idx_projects_status' });
    await queryInterface.addIndex('projects', ['priority'],     { name: 'idx_projects_priority' });
    await queryInterface.addIndex('projects', ['departmentId'], { name: 'idx_projects_departmentId' });
    await queryInterface.addIndex('projects', ['startDate', 'endDate'], { name: 'idx_projects_dates' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('projects');
  }
};

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_projects', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true
      },
      userId: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE'
      },
      projectId: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE'
      },
      role: {
        type:         Sequelize.ENUM('viewer', 'contributor', 'lead', 'owner'),
        allowNull:    false,
        defaultValue: 'contributor'
      },
      joinedAt: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.NOW
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

    // Unique composite — one user can only be in a project once
    await queryInterface.addIndex('user_projects', ['userId', 'projectId'], {
      unique: true,
      name:   'idx_user_projects_unique'
    });
    await queryInterface.addIndex('user_projects', ['userId'],    { name: 'idx_user_projects_userId' });
    await queryInterface.addIndex('user_projects', ['projectId'], { name: 'idx_user_projects_projectId' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_projects');
  }
};

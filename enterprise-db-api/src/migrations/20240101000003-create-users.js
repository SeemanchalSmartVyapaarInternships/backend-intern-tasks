'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true
      },
      firstName: {
        type:      Sequelize.STRING(50),
        allowNull: false
      },
      lastName: {
        type:      Sequelize.STRING(50),
        allowNull: false
      },
      email: {
        type:      Sequelize.STRING(150),
        allowNull: false,
        unique:    true
      },
      phone: {
        type:      Sequelize.STRING(20),
        allowNull: true
      },
      avatar: {
        type:      Sequelize.STRING(500),
        allowNull: true
      },
      jobTitle: {
        type:      Sequelize.STRING(100),
        allowNull: true
      },
      salary: {
        type:         Sequelize.DECIMAL(12, 2),
        allowNull:    true,
        defaultValue: 0.00
      },
      hireDate: {
        type:      Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type:         Sequelize.ENUM('active', 'inactive', 'suspended', 'on_leave'),
        allowNull:    false,
        defaultValue: 'active'
      },
      // FK: One-to-One with roles
      roleId: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'roles', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL'
      },
      // FK: Many-to-One with departments
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

    // Indexes
    await queryInterface.addIndex('users', ['email'],        { unique: true, name: 'idx_users_email' });
    await queryInterface.addIndex('users', ['roleId'],       { name: 'idx_users_roleId' });
    await queryInterface.addIndex('users', ['departmentId'], { name: 'idx_users_departmentId' });
    await queryInterface.addIndex('users', ['status'],       { name: 'idx_users_status' });
    await queryInterface.addIndex('users', ['firstName', 'lastName'], { name: 'idx_users_fullname' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};

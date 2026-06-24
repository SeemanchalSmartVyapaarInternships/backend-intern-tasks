'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true
      },
      name: {
        type:      Sequelize.STRING(50),
        allowNull: false,
        unique:    true
      },
      description: {
        type:      Sequelize.STRING(255),
        allowNull: true
      },
      permissions: {
        type:         Sequelize.JSON,
        allowNull:    false,
        defaultValue: '[]'
      },
      isActive: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: true
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
    await queryInterface.addIndex('roles', ['name'],     { unique: true, name: 'idx_roles_name' });
    await queryInterface.addIndex('roles', ['isActive'], { name: 'idx_roles_isActive' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  }
};

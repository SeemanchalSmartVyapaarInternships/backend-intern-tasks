'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
        unique:    true
      },
      code: {
        type:      Sequelize.STRING(10),
        allowNull: false,
        unique:    true
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true
      },
      headOfDepartment: {
        type:      Sequelize.STRING(100),
        allowNull: true
      },
      budget: {
        type:         Sequelize.DECIMAL(15, 2),
        allowNull:    true,
        defaultValue: 0.00
      },
      location: {
        type:      Sequelize.STRING(150),
        allowNull: true
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

    await queryInterface.addIndex('departments', ['name'],     { unique: true, name: 'idx_departments_name' });
    await queryInterface.addIndex('departments', ['code'],     { unique: true, name: 'idx_departments_code' });
    await queryInterface.addIndex('departments', ['isActive'], { name: 'idx_departments_isActive' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('departments');
  }
};

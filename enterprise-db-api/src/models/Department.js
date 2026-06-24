'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Department extends Model {
    static associate(models) {
      // One-to-Many: A Department has many Users
      Department.hasMany(models.User, {
        foreignKey: { name: 'departmentId', allowNull: true },
        as: 'users'
      });
    }
  }

  Department.init({
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true
    },
    name: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      unique:    true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    code: {
      // Short identifier e.g. "ENG", "HR", "FIN"
      type:      DataTypes.STRING(10),
      allowNull: false,
      unique:    true,
      validate: {
        notEmpty: true,
        isUppercase: true
      }
    },
    description: {
      type:      DataTypes.TEXT,
      allowNull: true
    },
    headOfDepartment: {
      type:      DataTypes.STRING(100),
      allowNull: true
    },
    budget: {
      type:         DataTypes.DECIMAL(15, 2),
      allowNull:    true,
      defaultValue: 0.00
    },
    location: {
      type:      DataTypes.STRING(150),
      allowNull: true
    },
    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName:       'Department',
    tableName:       'departments',
    freezeTableName: true,
    timestamps:      true,
    indexes: [
      { unique: true, fields: ['name'] },
      { unique: true, fields: ['code'] },
      { fields: ['isActive'] }
    ]
  });

  return Department;
};

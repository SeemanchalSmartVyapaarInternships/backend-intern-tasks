'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // One-to-One: User belongs to one Role
      User.belongsTo(models.Role, {
        foreignKey: { name: 'roleId', allowNull: true },
        as: 'role'
      });

      // One-to-Many (inverse): User belongs to one Department
      User.belongsTo(models.Department, {
        foreignKey: { name: 'departmentId', allowNull: true },
        as: 'department'
      });

      // Many-to-Many: User ↔ Projects via user_projects junction
      User.belongsToMany(models.Project, {
        through:    models.UserProject,
        foreignKey: 'userId',
        otherKey:   'projectId',
        as:         'projects'
      });

      // Tasks assigned to a user
      User.hasMany(models.Task, {
        foreignKey: { name: 'assigneeId', allowNull: true },
        as: 'assignedTasks'
      });
    }
  }

  User.init({
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true
    },
    firstName: {
      type:      DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type:      DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type:      DataTypes.STRING(150),
      allowNull: false,
      unique:    true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    phone: {
      type:      DataTypes.STRING(20),
      allowNull: true
    },
    avatar: {
      type:      DataTypes.STRING(500),
      allowNull: true
    },
    jobTitle: {
      type:      DataTypes.STRING(100),
      allowNull: true
    },
    salary: {
      type:         DataTypes.DECIMAL(12, 2),
      allowNull:    true,
      defaultValue: 0.00
    },
    hireDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type:         DataTypes.ENUM('active', 'inactive', 'suspended', 'on_leave'),
      allowNull:    false,
      defaultValue: 'active'
    },
    // FK: One-to-One with Role
    roleId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'roles', key: 'id' }
    },
    // FK: One-to-Many (Many side) with Department
    departmentId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'departments', key: 'id' }
    }
  }, {
    sequelize,
    modelName:       'User',
    tableName:       'users',
    freezeTableName: true,
    timestamps:      true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['roleId'] },
      { fields: ['departmentId'] },
      { fields: ['status'] },
      // Composite for common search queries
      { fields: ['firstName', 'lastName'] }
    ]
  });

  return User;
};

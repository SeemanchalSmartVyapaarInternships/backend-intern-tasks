'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Project extends Model {
    static associate(models) {
      // One-to-Many: Project has many Tasks
      Project.hasMany(models.Task, {
        foreignKey: { name: 'projectId', allowNull: false },
        as: 'tasks'
      });

      // Many-to-Many: Project ↔ Users via user_projects
      Project.belongsToMany(models.User, {
        through:    models.UserProject,
        foreignKey: 'projectId',
        otherKey:   'userId',
        as:         'members'
      });

      // Project belongs to Department (optional grouping)
      Project.belongsTo(models.Department, {
        foreignKey: { name: 'departmentId', allowNull: true },
        as: 'department'
      });
    }
  }

  Project.init({
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true
    },
    name: {
      type:      DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 150]
      }
    },
    description: {
      type:      DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type:         DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
      allowNull:    false,
      defaultValue: 'planning'
    },
    priority: {
      type:         DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull:    false,
      defaultValue: 'medium'
    },
    startDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true
    },
    endDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true
    },
    budget: {
      type:         DataTypes.DECIMAL(15, 2),
      allowNull:    true,
      defaultValue: 0.00
    },
    progress: {
      // 0–100 percentage
      type:         DataTypes.TINYINT.UNSIGNED,
      allowNull:    false,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    departmentId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'departments', key: 'id' }
    }
  }, {
    sequelize,
    modelName:       'Project',
    tableName:       'projects',
    freezeTableName: true,
    timestamps:      true,
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['departmentId'] },
      { fields: ['startDate', 'endDate'] }
    ]
  });

  return Project;
};

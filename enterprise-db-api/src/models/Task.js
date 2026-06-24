'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Task extends Model {
    static associate(models) {
      // Many side of One-to-Many: Task belongs to Project
      Task.belongsTo(models.Project, {
        foreignKey: { name: 'projectId', allowNull: false },
        as: 'project'
      });

      // Task has an optional assignee (User)
      Task.belongsTo(models.User, {
        foreignKey: { name: 'assigneeId', allowNull: true },
        as: 'assignee'
      });
    }
  }

  Task.init({
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true
    },
    title: {
      type:      DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 200]
      }
    },
    description: {
      type:      DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type:         DataTypes.ENUM('todo', 'in_progress', 'in_review', 'completed', 'cancelled'),
      allowNull:    false,
      defaultValue: 'todo'
    },
    priority: {
      type:         DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull:    false,
      defaultValue: 'medium'
    },
    dueDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true
    },
    estimatedHours: {
      type:         DataTypes.DECIMAL(6, 2),
      allowNull:    true,
      defaultValue: 0.00
    },
    loggedHours: {
      type:         DataTypes.DECIMAL(6, 2),
      allowNull:    false,
      defaultValue: 0.00
    },
    tags: {
      // JSON array of string tags
      type:         DataTypes.JSON,
      allowNull:    false,
      defaultValue: []
    },
    // FK: belongs to Project (required)
    projectId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'projects', key: 'id' }
    },
    // FK: optional assignee
    assigneeId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  }, {
    sequelize,
    modelName:       'Task',
    tableName:       'tasks',
    freezeTableName: true,
    timestamps:      true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['assigneeId'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['dueDate'] },
      // Composite: most common query pattern
      { fields: ['projectId', 'status'] },
      { fields: ['assigneeId', 'status'] }
    ]
  });

  return Task;
};

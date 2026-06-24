'use strict';

const sequelize  = require('../config/sequelize');

// Import all model factories
const RoleModel        = require('./Role');
const DepartmentModel  = require('./Department');
const UserModel        = require('./User');
const ProjectModel     = require('./Project');
const TaskModel        = require('./Task');
const UserProjectModel = require('./UserProject');

// Initialize models by calling each factory with the sequelize instance
const Role        = RoleModel(sequelize);
const Department  = DepartmentModel(sequelize);
const User        = UserModel(sequelize);
const Project     = ProjectModel(sequelize);
const Task        = TaskModel(sequelize);
const UserProject = UserProjectModel(sequelize);

// Collect all models into a single object
const models = {
  sequelize,
  Role,
  Department,
  User,
  Project,
  Task,
  UserProject
};

// Run associations — each model's associate() receives the full models map
Object.values(models).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = models;

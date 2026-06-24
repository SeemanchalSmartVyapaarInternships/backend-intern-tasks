'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserProject extends Model {
    static associate(models) {
      // Junction table — no additional associations needed here.
      // Belongs to both User and Project for eager loading.
      UserProject.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      UserProject.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    }
  }

  UserProject.init({
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true
    },
    userId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    projectId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'projects', key: 'id' }
    },
    // Extra junction attributes
    role: {
      // Role in the project context (not system role)
      type:         DataTypes.ENUM('viewer', 'contributor', 'lead', 'owner'),
      allowNull:    false,
      defaultValue: 'contributor'
    },
    joinedAt: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName:       'UserProject',
    tableName:       'user_projects',
    freezeTableName: true,
    timestamps:      true,
    indexes: [
      // Enforce uniqueness: a user can only be in a project once
      { unique: true, fields: ['userId', 'projectId'] },
      { fields: ['userId'] },
      { fields: ['projectId'] }
    ]
  });

  return UserProject;
};

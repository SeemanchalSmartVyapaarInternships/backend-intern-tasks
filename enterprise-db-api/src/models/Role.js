'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      // One-to-One: A Role belongs to one User (each role is uniquely assigned)
      Role.hasOne(models.User, {
        foreignKey: { name: 'roleId', allowNull: true },
        as: 'user'
      });
    }
  }

  Role.init({
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true
    },
    name: {
      type:      DataTypes.STRING(50),
      allowNull: false,
      unique:    true,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    description: {
      type:      DataTypes.STRING(255),
      allowNull: true
    },
    permissions: {
      // Store as JSON array: e.g. ["read:users","write:projects"]
      type:      DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName:     'Role',
    tableName:     'roles',
    freezeTableName: true,
    timestamps:    true,
    indexes: [
      { unique: true, fields: ['name'] },
      { fields: ['isActive'] }
    ]
  });

  return Role;
};

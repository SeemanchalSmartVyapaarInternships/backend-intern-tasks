'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      {
        name:        'Super Admin',
        description: 'Full system access with all permissions',
        permissions: JSON.stringify(['*']),
        isActive:    true,
        createdAt:   now,
        updatedAt:   now
      },
      {
        name:        'Admin',
        description: 'Administrative access excluding system settings',
        permissions: JSON.stringify([
          'read:users', 'write:users', 'delete:users',
          'read:projects', 'write:projects',
          'read:tasks', 'write:tasks',
          'read:departments', 'write:departments'
        ]),
        isActive:  true,
        createdAt: now,
        updatedAt: now
      },
      {
        name:        'Project Manager',
        description: 'Manage projects and their tasks',
        permissions: JSON.stringify([
          'read:users',
          'read:projects', 'write:projects',
          'read:tasks', 'write:tasks', 'delete:tasks'
        ]),
        isActive:  true,
        createdAt: now,
        updatedAt: now
      },
      {
        name:        'Developer',
        description: 'Work on assigned tasks and projects',
        permissions: JSON.stringify([
          'read:projects',
          'read:tasks', 'write:tasks'
        ]),
        isActive:  true,
        createdAt: now,
        updatedAt: now
      },
      {
        name:        'Viewer',
        description: 'Read-only access',
        permissions: JSON.stringify([
          'read:users', 'read:projects', 'read:tasks', 'read:departments'
        ]),
        isActive:  true,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};

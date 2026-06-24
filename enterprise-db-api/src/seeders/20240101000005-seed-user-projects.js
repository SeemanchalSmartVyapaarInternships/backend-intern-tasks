'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('user_projects', [
      // ERP System (project 1)
      { userId: 1, projectId: 1, role: 'owner',       joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 4, projectId: 1, role: 'lead',        joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 8, projectId: 1, role: 'contributor', joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 5, projectId: 1, role: 'contributor', joinedAt: now, createdAt: now, updatedAt: now },
      // HR Portal (project 2)
      { userId: 2, projectId: 2, role: 'owner',       joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 4, projectId: 2, role: 'contributor', joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 5, projectId: 2, role: 'contributor', joinedAt: now, createdAt: now, updatedAt: now },
      // Mobile Analytics (project 3)
      { userId: 3, projectId: 3, role: 'owner',       joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 8, projectId: 3, role: 'lead',        joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 6, projectId: 3, role: 'contributor', joinedAt: now, createdAt: now, updatedAt: now },
      // Legacy Migration (project 4)
      { userId: 1, projectId: 4, role: 'owner',       joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 4, projectId: 4, role: 'lead',        joinedAt: now, createdAt: now, updatedAt: now },
      // Loyalty Platform (project 5)
      { userId: 3, projectId: 5, role: 'owner',       joinedAt: now, createdAt: now, updatedAt: now },
      { userId: 8, projectId: 5, role: 'contributor', joinedAt: now, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_projects', null, {});
  }
};

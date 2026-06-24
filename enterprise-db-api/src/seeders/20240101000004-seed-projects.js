'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('projects', [
      {
        name: 'Enterprise ERP System', description: 'End-to-end ERP modernization for all business units',
        status: 'active', priority: 'critical',
        startDate: '2024-01-01', endDate: '2024-12-31',
        budget: 2000000.00, progress: 35, departmentId: 1,
        createdAt: now, updatedAt: now
      },
      {
        name: 'HR Self-Service Portal', description: 'Employee-facing portal for leave, payroll, and benefits',
        status: 'active', priority: 'high',
        startDate: '2024-03-01', endDate: '2024-09-30',
        budget: 500000.00, progress: 60, departmentId: 2,
        createdAt: now, updatedAt: now
      },
      {
        name: 'Mobile Analytics Dashboard', description: 'Real-time business intelligence mobile app',
        status: 'planning', priority: 'medium',
        startDate: '2024-07-01', endDate: '2025-01-31',
        budget: 800000.00, progress: 10, departmentId: 3,
        createdAt: now, updatedAt: now
      },
      {
        name: 'Legacy System Migration', description: 'Migrate legacy monolith to microservices architecture',
        status: 'on_hold', priority: 'high',
        startDate: '2024-02-01', endDate: '2024-11-30',
        budget: 1500000.00, progress: 20, departmentId: 1,
        createdAt: now, updatedAt: now
      },
      {
        name: 'Customer Loyalty Platform', description: 'Loyalty rewards and gamification system for customers',
        status: 'completed', priority: 'medium',
        startDate: '2023-06-01', endDate: '2024-01-15',
        budget: 600000.00, progress: 100, departmentId: 3,
        createdAt: now, updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('projects', null, {});
  }
};

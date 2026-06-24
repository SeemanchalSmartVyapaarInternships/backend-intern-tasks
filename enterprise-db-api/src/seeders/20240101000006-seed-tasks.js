'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('tasks', [
      // ERP (project 1)
      { title: 'Design database schema', description: 'ER diagram and normalization for ERP modules',
        status: 'completed', priority: 'critical', dueDate: '2024-02-01',
        estimatedHours: 40, loggedHours: 38, tags: JSON.stringify(['database','design']),
        projectId: 1, assigneeId: 4, createdAt: now, updatedAt: now },
      { title: 'Build REST API layer', description: 'Node.js/Express APIs for all ERP entities',
        status: 'in_progress', priority: 'high', dueDate: '2024-04-30',
        estimatedHours: 120, loggedHours: 75, tags: JSON.stringify(['backend','api']),
        projectId: 1, assigneeId: 4, createdAt: now, updatedAt: now },
      { title: 'Frontend ERP dashboard', description: 'React dashboard for ERP modules',
        status: 'todo', priority: 'high', dueDate: '2024-06-30',
        estimatedHours: 100, loggedHours: 0, tags: JSON.stringify(['frontend','react']),
        projectId: 1, assigneeId: 8, createdAt: now, updatedAt: now },
      { title: 'Write integration tests', description: 'Test coverage for all API endpoints',
        status: 'todo', priority: 'medium', dueDate: '2024-05-15',
        estimatedHours: 60, loggedHours: 0, tags: JSON.stringify(['testing','qa']),
        projectId: 1, assigneeId: 5, createdAt: now, updatedAt: now },
      // HR Portal (project 2)
      { title: 'Leave management module', description: 'Apply, approve, and track leave requests',
        status: 'completed', priority: 'high', dueDate: '2024-04-15',
        estimatedHours: 50, loggedHours: 52, tags: JSON.stringify(['hr','module']),
        projectId: 2, assigneeId: 4, createdAt: now, updatedAt: now },
      { title: 'Payroll integration', description: 'Connect payroll system with HR portal',
        status: 'in_progress', priority: 'critical', dueDate: '2024-06-30',
        estimatedHours: 80, loggedHours: 40, tags: JSON.stringify(['payroll','integration']),
        projectId: 2, assigneeId: 4, createdAt: now, updatedAt: now },
      { title: 'Employee onboarding workflow', description: 'Digital onboarding checklist and workflow',
        status: 'in_review', priority: 'medium', dueDate: '2024-05-31',
        estimatedHours: 35, loggedHours: 33, tags: JSON.stringify(['onboarding','workflow']),
        projectId: 2, assigneeId: 5, createdAt: now, updatedAt: now },
      // Mobile Analytics (project 3)
      { title: 'Setup React Native project', description: 'Initialize RN project with navigation and state',
        status: 'completed', priority: 'high', dueDate: '2024-07-20',
        estimatedHours: 20, loggedHours: 18, tags: JSON.stringify(['mobile','react-native']),
        projectId: 3, assigneeId: 8, createdAt: now, updatedAt: now },
      { title: 'Charts and analytics components', description: 'Data visualization components for dashboard',
        status: 'in_progress', priority: 'high', dueDate: '2024-08-31',
        estimatedHours: 60, loggedHours: 20, tags: JSON.stringify(['charts','ui']),
        projectId: 3, assigneeId: 8, createdAt: now, updatedAt: now },
      // Legacy Migration (project 4)
      { title: 'Audit legacy codebase', description: 'Map all legacy modules and dependencies',
        status: 'completed', priority: 'critical', dueDate: '2024-03-01',
        estimatedHours: 80, loggedHours: 90, tags: JSON.stringify(['audit','legacy']),
        projectId: 4, assigneeId: 4, createdAt: now, updatedAt: now },
      { title: 'Design microservices boundaries', description: 'Domain-driven decomposition of monolith',
        status: 'in_review', priority: 'critical', dueDate: '2024-04-30',
        estimatedHours: 60, loggedHours: 55, tags: JSON.stringify(['architecture','microservices']),
        projectId: 4, assigneeId: 1, createdAt: now, updatedAt: now },
      { title: 'Migrate authentication service', description: 'Extract auth module as standalone service',
        status: 'todo', priority: 'high', dueDate: '2024-07-31',
        estimatedHours: 100, loggedHours: 0, tags: JSON.stringify(['auth','microservices']),
        projectId: 4, assigneeId: 4, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tasks', null, {});
  }
};

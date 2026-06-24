'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('departments', [
      {
        name:             'Engineering',
        code:             'ENG',
        description:      'Software development, architecture and DevOps',
        headOfDepartment: 'Arjun Mehta',
        budget:           5000000.00,
        location:         'Block A, Floor 3',
        isActive:         true,
        createdAt:        now,
        updatedAt:        now
      },
      {
        name:             'Human Resources',
        code:             'HR',
        description:      'Talent acquisition, employee welfare, and compliance',
        headOfDepartment: 'Priya Sharma',
        budget:           1500000.00,
        location:         'Block B, Floor 1',
        isActive:         true,
        createdAt:        now,
        updatedAt:        now
      },
      {
        name:             'Product Management',
        code:             'PM',
        description:      'Product strategy, roadmap, and stakeholder management',
        headOfDepartment: 'Rahul Nair',
        budget:           2000000.00,
        location:         'Block A, Floor 2',
        isActive:         true,
        createdAt:        now,
        updatedAt:        now
      },
      {
        name:             'Finance',
        code:             'FIN',
        description:      'Accounting, budgeting, and financial planning',
        headOfDepartment: 'Sunita Gupta',
        budget:           1000000.00,
        location:         'Block C, Floor 1',
        isActive:         true,
        createdAt:        now,
        updatedAt:        now
      },
      {
        name:             'Quality Assurance',
        code:             'QA',
        description:      'Testing, quality control, and process improvement',
        headOfDepartment: 'Amit Bose',
        budget:           800000.00,
        location:         'Block A, Floor 4',
        isActive:         true,
        createdAt:        now,
        updatedAt:        now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('departments', null, {});
  }
};

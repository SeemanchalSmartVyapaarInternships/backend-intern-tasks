'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('users', [
      {
        firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@company.com',
        phone: '+91-9800000001', jobTitle: 'CTO', salary: 250000.00,
        hireDate: '2019-01-15', status: 'active',
        roleId: 1, departmentId: 1, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@company.com',
        phone: '+91-9800000002', jobTitle: 'HR Director', salary: 180000.00,
        hireDate: '2019-03-10', status: 'active',
        roleId: 2, departmentId: 2, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Rahul', lastName: 'Nair', email: 'rahul.nair@company.com',
        phone: '+91-9800000003', jobTitle: 'Product Manager', salary: 160000.00,
        hireDate: '2020-06-01', status: 'active',
        roleId: 3, departmentId: 3, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Vishal', lastName: 'Kumar', email: 'vishal.kumar@company.com',
        phone: '+91-9800000004', jobTitle: 'Senior Backend Developer', salary: 120000.00,
        hireDate: '2021-08-15', status: 'active',
        roleId: 4, departmentId: 1, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Sneha', lastName: 'Roy', email: 'sneha.roy@company.com',
        phone: '+91-9800000005', jobTitle: 'QA Engineer', salary: 90000.00,
        hireDate: '2022-01-10', status: 'active',
        roleId: 4, departmentId: 5, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Amit', lastName: 'Bose', email: 'amit.bose@company.com',
        phone: '+91-9800000006', jobTitle: 'QA Lead', salary: 110000.00,
        hireDate: '2020-11-20', status: 'active',
        roleId: 3, departmentId: 5, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Sunita', lastName: 'Gupta', email: 'sunita.gupta@company.com',
        phone: '+91-9800000007', jobTitle: 'Finance Manager', salary: 140000.00,
        hireDate: '2019-07-01', status: 'active',
        roleId: 2, departmentId: 4, createdAt: now, updatedAt: now
      },
      {
        firstName: 'Ravi', lastName: 'Singh', email: 'ravi.singh@company.com',
        phone: '+91-9800000008', jobTitle: 'Frontend Developer', salary: 100000.00,
        hireDate: '2022-05-15', status: 'active',
        roleId: 4, departmentId: 1, createdAt: now, updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  }
};

'use strict';

const { Department, User, Project } = require('../models');
const asyncHandler                  = require('../middlewares/asyncHandler');
const AppError                      = require('../middlewares/AppError');
const { sendSuccess }               = require('../middlewares/sendSuccess');
const { parseQuery }                = require('../middlewares/queryParser');

// GET /api/departments
exports.getAllDepartments = asyncHandler(async (req, res) => {
  const { page, limit, offset, order, where } = parseQuery(req.query, {
    searchFields: ['name', 'code', 'headOfDepartment', 'location'],
    filterFields: ['isActive']
  });

  const { count, rows } = await Department.findAndCountAll({
    where,
    order,
    limit,
    offset
  });

  sendSuccess(res, 200, 'Departments retrieved', rows, {
    total: count, page, limit, totalPages: Math.ceil(count / limit)
  });
});

// GET /api/departments/:id
exports.getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id, {
    include: [
      { model: User,    as: 'users',    attributes: ['id', 'firstName', 'lastName', 'email', 'jobTitle', 'status'] },
      { model: Project, as: 'projects', attributes: ['id', 'name', 'status', 'priority', 'progress'] }
    ]
  });
  if (!dept) throw new AppError('Department not found', 404);
  sendSuccess(res, 200, 'Department retrieved', dept);
});

// POST /api/departments
exports.createDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.create(req.body);
  sendSuccess(res, 201, 'Department created', dept);
});

// PUT /api/departments/:id
exports.updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) throw new AppError('Department not found', 404);
  await dept.update(req.body);
  sendSuccess(res, 200, 'Department updated', dept);
});

// DELETE /api/departments/:id
exports.deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) throw new AppError('Department not found', 404);
  await dept.destroy();
  sendSuccess(res, 200, 'Department deleted', null);
});

'use strict';

const { Role, User }       = require('../models');
const asyncHandler         = require('../middlewares/asyncHandler');
const AppError             = require('../middlewares/AppError');
const { sendSuccess }      = require('../middlewares/sendSuccess');
const { parseQuery }       = require('../middlewares/queryParser');

// GET /api/roles  — list with pagination, search, sort
exports.getAllRoles = asyncHandler(async (req, res) => {
  const { page, limit, offset, order, where } = parseQuery(req.query, {
    searchFields: ['name', 'description'],
    filterFields: ['isActive']
  });

  const { count, rows } = await Role.findAndCountAll({
    where,
    order,
    limit,
    offset,
    attributes: ['id', 'name', 'description', 'permissions', 'isActive', 'createdAt']
  });

  sendSuccess(res, 200, 'Roles retrieved', rows, {
    total: count, page, limit, totalPages: Math.ceil(count / limit)
  });
});

// GET /api/roles/:id
exports.getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });
  if (!role) throw new AppError('Role not found', 404);
  sendSuccess(res, 200, 'Role retrieved', role);
});

// POST /api/roles
exports.createRole = asyncHandler(async (req, res) => {
  const role = await Role.create(req.body);
  sendSuccess(res, 201, 'Role created', role);
});

// PUT /api/roles/:id
exports.updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw new AppError('Role not found', 404);
  await role.update(req.body);
  sendSuccess(res, 200, 'Role updated', role);
});

// DELETE /api/roles/:id
exports.deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw new AppError('Role not found', 404);
  await role.destroy();
  sendSuccess(res, 200, 'Role deleted', null);
});

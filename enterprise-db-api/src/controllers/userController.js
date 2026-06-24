'use strict';

const { User, Role, Department, Project, Task } = require('../models');
const asyncHandler    = require('../middlewares/asyncHandler');
const AppError        = require('../middlewares/AppError');
const { sendSuccess } = require('../middlewares/sendSuccess');
const { parseQuery }  = require('../middlewares/queryParser');

// GET /api/users?page=1&limit=10&search=vishal&sort=firstName&order=ASC&status=active&departmentId=1
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset, order, where } = parseQuery(req.query, {
    searchFields: ['firstName', 'lastName', 'email', 'jobTitle'],
    filterFields: ['status', 'departmentId', 'roleId']
  });

  const { count, rows } = await User.findAndCountAll({
    where,
    order,
    limit,
    offset,
    attributes: { exclude: [] },
    include: [
      { model: Role,       as: 'role',       attributes: ['id', 'name'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
    ]
  });

  sendSuccess(res, 200, 'Users retrieved', rows, {
    total: count, page, limit, totalPages: Math.ceil(count / limit)
  });
});

// GET /api/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [
      { model: Role,       as: 'role',       attributes: ['id', 'name', 'permissions'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code', 'location'] },
      { model: Project,    as: 'projects',   attributes: ['id', 'name', 'status', 'priority', 'progress'],
        through: { attributes: ['role', 'joinedAt'] } },
      { model: Task,       as: 'assignedTasks',
        attributes: ['id', 'title', 'status', 'priority', 'dueDate'],
        limit: 10, order: [['dueDate', 'ASC']] }
    ]
  });
  if (!user) throw new AppError('User not found', 404);
  sendSuccess(res, 200, 'User retrieved', user);
});

// POST /api/users
exports.createUser = asyncHandler(async (req, res) => {
  // Check email uniqueness with a clear message before Sequelize throws
  const existing = await User.findOne({ where: { email: req.body.email } });
  if (existing) throw new AppError(`Email '${req.body.email}' is already registered`, 409);

  const user = await User.create(req.body);

  // Re-fetch with associations for response
  const result = await User.findByPk(user.id, {
    include: [
      { model: Role,       as: 'role',       attributes: ['id', 'name'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
    ]
  });
  sendSuccess(res, 201, 'User created', result);
});

// PUT /api/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (req.body.email && req.body.email !== user.email) {
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing) throw new AppError(`Email '${req.body.email}' is already in use`, 409);
  }

  await user.update(req.body);
  const result = await User.findByPk(user.id, {
    include: [
      { model: Role,       as: 'role',       attributes: ['id', 'name'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
    ]
  });
  sendSuccess(res, 200, 'User updated', result);
});

// DELETE /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  await user.destroy();
  sendSuccess(res, 200, 'User deleted', null);
});

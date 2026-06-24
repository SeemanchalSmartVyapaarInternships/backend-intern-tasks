'use strict';

const { Task, Project, User } = require('../models');
const asyncHandler    = require('../middlewares/asyncHandler');
const AppError        = require('../middlewares/AppError');
const { sendSuccess } = require('../middlewares/sendSuccess');
const { parseQuery }  = require('../middlewares/queryParser');

// GET /api/tasks?status=completed&priority=high&projectId=1&assigneeId=4
exports.getAllTasks = asyncHandler(async (req, res) => {
  const { page, limit, offset, order, where } = parseQuery(req.query, {
    searchFields: ['title', 'description'],
    filterFields: ['status', 'priority', 'projectId', 'assigneeId']
  });

  const { count, rows } = await Task.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [
      { model: Project, as: 'project',  attributes: ['id', 'name', 'status'] },
      { model: User,    as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    distinct: true
  });

  sendSuccess(res, 200, 'Tasks retrieved', rows, {
    total: count, page, limit, totalPages: Math.ceil(count / limit)
  });
});

// GET /api/tasks/:id
exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id, {
    include: [
      { model: Project, as: 'project',  attributes: ['id', 'name', 'status', 'priority'] },
      { model: User,    as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'jobTitle'] }
    ]
  });
  if (!task) throw new AppError('Task not found', 404);
  sendSuccess(res, 200, 'Task retrieved', task);
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  // Verify the project exists before creating the task
  const project = await Project.findByPk(req.body.projectId);
  if (!project) throw new AppError(`Project with id ${req.body.projectId} not found`, 404);

  if (req.body.assigneeId) {
    const user = await User.findByPk(req.body.assigneeId);
    if (!user) throw new AppError(`User with id ${req.body.assigneeId} not found`, 404);
  }

  const task = await Task.create(req.body);
  const result = await Task.findByPk(task.id, {
    include: [
      { model: Project, as: 'project',  attributes: ['id', 'name'] },
      { model: User,    as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
  sendSuccess(res, 201, 'Task created', result);
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) throw new AppError('Task not found', 404);

  if (req.body.projectId) {
    const project = await Project.findByPk(req.body.projectId);
    if (!project) throw new AppError(`Project with id ${req.body.projectId} not found`, 404);
  }

  if (req.body.assigneeId) {
    const user = await User.findByPk(req.body.assigneeId);
    if (!user) throw new AppError(`User with id ${req.body.assigneeId} not found`, 404);
  }

  await task.update(req.body);
  const result = await Task.findByPk(task.id, {
    include: [
      { model: Project, as: 'project',  attributes: ['id', 'name'] },
      { model: User,    as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
  sendSuccess(res, 200, 'Task updated', result);
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  await task.destroy();
  sendSuccess(res, 200, 'Task deleted', null);
});

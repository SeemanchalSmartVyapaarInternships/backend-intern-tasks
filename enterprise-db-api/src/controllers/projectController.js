'use strict';

const { Project, User, Task, Department, UserProject } = require('../models');
const asyncHandler    = require('../middlewares/asyncHandler');
const AppError        = require('../middlewares/AppError');
const { sendSuccess } = require('../middlewares/sendSuccess');
const { parseQuery }  = require('../middlewares/queryParser');

// GET /api/projects?status=active&priority=high&departmentId=1&search=erp
exports.getAllProjects = asyncHandler(async (req, res) => {
  const { page, limit, offset, order, where } = parseQuery(req.query, {
    searchFields: ['name', 'description'],
    filterFields: ['status', 'priority', 'departmentId']
  });

  const { count, rows } = await Project.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
    ],
    distinct: true  // needed when include has hasMany to get correct count
  });

  sendSuccess(res, 200, 'Projects retrieved', rows, {
    total: count, page, limit, totalPages: Math.ceil(count / limit)
  });
});

// GET /api/projects/:id
exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id, {
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      { model: User,       as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email', 'jobTitle'],
        through: { attributes: ['role', 'joinedAt'] }
      },
      { model: Task, as: 'tasks',
        attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'assigneeId'],
        order: [['dueDate', 'ASC']]
      }
    ]
  });
  if (!project) throw new AppError('Project not found', 404);
  sendSuccess(res, 200, 'Project retrieved', project);
});

// POST /api/projects
exports.createProject = asyncHandler(async (req, res) => {
  const project = await Project.create(req.body);
  sendSuccess(res, 201, 'Project created', project);
});

// PUT /api/projects/:id
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  await project.update(req.body);
  sendSuccess(res, 200, 'Project updated', project);
});

// DELETE /api/projects/:id
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  await project.destroy();
  sendSuccess(res, 200, 'Project deleted', null);
});

// POST /api/projects/:id/members  — add a user to a project
exports.addMember = asyncHandler(async (req, res) => {
  const { userId, role = 'contributor' } = req.body;

  const project = await Project.findByPk(req.params.id);
  if (!project) throw new AppError('Project not found', 404);

  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);

  const existing = await UserProject.findOne({ where: { userId, projectId: req.params.id } });
  if (existing) throw new AppError('User is already a member of this project', 409);

  const membership = await UserProject.create({
    userId,
    projectId: parseInt(req.params.id),
    role,
    joinedAt: new Date()
  });
  sendSuccess(res, 201, 'Member added to project', membership);
});

// DELETE /api/projects/:id/members/:userId  — remove a member
exports.removeMember = asyncHandler(async (req, res) => {
  const { id: projectId, userId } = req.params;
  const membership = await UserProject.findOne({ where: { projectId, userId } });
  if (!membership) throw new AppError('Membership not found', 404);
  await membership.destroy();
  sendSuccess(res, 200, 'Member removed from project', null);
});

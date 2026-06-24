'use strict';

const Joi = require('joi');

// ─── Role ─────────────────────────────────────────────────────────────────────

const createRole = Joi.object({
  name:        Joi.string().min(2).max(50).required(),
  description: Joi.string().max(255).optional().allow('', null),
  permissions: Joi.array().items(Joi.string()).default([]),
  isActive:    Joi.boolean().default(true)
});

const updateRole = Joi.object({
  name:        Joi.string().min(2).max(50),
  description: Joi.string().max(255).allow('', null),
  permissions: Joi.array().items(Joi.string()),
  isActive:    Joi.boolean()
}).min(1); // at least one field required

// ─── Department ───────────────────────────────────────────────────────────────

const createDepartment = Joi.object({
  name:             Joi.string().min(2).max(100).required(),
  code:             Joi.string().uppercase().min(2).max(10).required(),
  description:      Joi.string().allow('', null),
  headOfDepartment: Joi.string().max(100).allow('', null),
  budget:           Joi.number().precision(2).min(0).allow(null),
  location:         Joi.string().max(150).allow('', null),
  isActive:         Joi.boolean().default(true)
});

const updateDepartment = Joi.object({
  name:             Joi.string().min(2).max(100),
  code:             Joi.string().uppercase().min(2).max(10),
  description:      Joi.string().allow('', null),
  headOfDepartment: Joi.string().max(100).allow('', null),
  budget:           Joi.number().precision(2).min(0).allow(null),
  location:         Joi.string().max(150).allow('', null),
  isActive:         Joi.boolean()
}).min(1);

// ─── User ─────────────────────────────────────────────────────────────────────

const createUser = Joi.object({
  firstName:    Joi.string().min(2).max(50).required(),
  lastName:     Joi.string().min(2).max(50).required(),
  email:        Joi.string().email().max(150).required(),
  phone:        Joi.string().max(20).allow('', null),
  avatar:       Joi.string().uri().max(500).allow('', null),
  jobTitle:     Joi.string().max(100).allow('', null),
  salary:       Joi.number().precision(2).min(0).allow(null),
  hireDate:     Joi.string().isoDate().allow(null),
  status:       Joi.string().valid('active', 'inactive', 'suspended', 'on_leave').default('active'),
  roleId:       Joi.number().integer().positive().allow(null),
  departmentId: Joi.number().integer().positive().allow(null)
});

const updateUser = Joi.object({
  firstName:    Joi.string().min(2).max(50),
  lastName:     Joi.string().min(2).max(50),
  email:        Joi.string().email().max(150),
  phone:        Joi.string().max(20).allow('', null),
  avatar:       Joi.string().uri().max(500).allow('', null),
  jobTitle:     Joi.string().max(100).allow('', null),
  salary:       Joi.number().precision(2).min(0).allow(null),
  hireDate:     Joi.string().isoDate().allow(null),
  status:       Joi.string().valid('active', 'inactive', 'suspended', 'on_leave'),
  roleId:       Joi.number().integer().positive().allow(null),
  departmentId: Joi.number().integer().positive().allow(null)
}).min(1);

// ─── Project ──────────────────────────────────────────────────────────────────

const createProject = Joi.object({
  name:         Joi.string().min(3).max(150).required(),
  description:  Joi.string().allow('', null),
  status:       Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').default('planning'),
  priority:     Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  startDate:    Joi.string().isoDate().allow(null),
  endDate:      Joi.string().isoDate().allow(null),
  budget:       Joi.number().precision(2).min(0).allow(null),
  progress:     Joi.number().integer().min(0).max(100).default(0),
  departmentId: Joi.number().integer().positive().allow(null)
});

const updateProject = Joi.object({
  name:         Joi.string().min(3).max(150),
  description:  Joi.string().allow('', null),
  status:       Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled'),
  priority:     Joi.string().valid('low', 'medium', 'high', 'critical'),
  startDate:    Joi.string().isoDate().allow(null),
  endDate:      Joi.string().isoDate().allow(null),
  budget:       Joi.number().precision(2).min(0).allow(null),
  progress:     Joi.number().integer().min(0).max(100),
  departmentId: Joi.number().integer().positive().allow(null)
}).min(1);

// ─── Task ─────────────────────────────────────────────────────────────────────

const createTask = Joi.object({
  title:          Joi.string().min(3).max(200).required(),
  description:    Joi.string().allow('', null),
  status:         Joi.string().valid('todo', 'in_progress', 'in_review', 'completed', 'cancelled').default('todo'),
  priority:       Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  dueDate:        Joi.string().isoDate().allow(null),
  estimatedHours: Joi.number().precision(2).min(0).allow(null),
  loggedHours:    Joi.number().precision(2).min(0).default(0),
  tags:           Joi.array().items(Joi.string()).default([]),
  projectId:      Joi.number().integer().positive().required(),
  assigneeId:     Joi.number().integer().positive().allow(null)
});

const updateTask = Joi.object({
  title:          Joi.string().min(3).max(200),
  description:    Joi.string().allow('', null),
  status:         Joi.string().valid('todo', 'in_progress', 'in_review', 'completed', 'cancelled'),
  priority:       Joi.string().valid('low', 'medium', 'high', 'critical'),
  dueDate:        Joi.string().isoDate().allow(null),
  estimatedHours: Joi.number().precision(2).min(0).allow(null),
  loggedHours:    Joi.number().precision(2).min(0),
  tags:           Joi.array().items(Joi.string()),
  projectId:      Joi.number().integer().positive(),
  assigneeId:     Joi.number().integer().positive().allow(null)
}).min(1);

module.exports = {
  role:       { create: createRole,       update: updateRole },
  department: { create: createDepartment, update: updateDepartment },
  user:       { create: createUser,       update: updateUser },
  project:    { create: createProject,    update: updateProject },
  task:       { create: createTask,       update: updateTask }
};

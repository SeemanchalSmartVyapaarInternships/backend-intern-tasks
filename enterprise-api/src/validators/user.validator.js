/**
 * src/validators/user.validator.js
 *
 * ARCHITECTURE DECISION:
 * Validation schemas live in their own layer so they can be:
 *   • Reused across routes (e.g., create vs update)
 *   • Unit-tested independently of Express
 *   • Versioned alongside the route that uses them
 */

'use strict';

const Joi = require('joi');

// ── Reusable field definitions ────────────────────────────────────────────────

const id = Joi.string()
  .guid({ version: ['uuidv4'] })
  .required()
  .messages({
    'string.guid': 'ID must be a valid UUID v4',
    'any.required': 'ID is required',
  });

const email = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email':    'Please provide a valid email address',
    'any.required':    'Email is required',
    'string.max':      'Email must not exceed 255 characters',
  });

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    'string.min':     'Password must be at least 8 characters',
    'string.max':     'Password must not exceed 128 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'any.required':   'Password is required',
  });

// ── Schemas ───────────────────────────────────────────────────────────────────

/**
 * POST /users — create a new user
 */
const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min':  'Name must be at least 2 characters',
    'string.max':  'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email,
  password,
  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .default('user')
    .messages({
      'any.only': 'Role must be one of: user, admin, moderator',
    }),
});

/**
 * PUT /users/:id — full update
 */
const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(255),
  role: Joi.string().valid('user', 'admin', 'moderator'),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * GET /users — list with optional filters
 */
const listUsersSchema = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(10),
  role:   Joi.string().valid('user', 'admin', 'moderator'),
  search: Joi.string().trim().max(100),
  sortBy: Joi.string().valid('name', 'email', 'createdAt').default('createdAt'),
  order:  Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * GET /users/:id — validate route param
 */
const userIdParamSchema = Joi.object({ id });

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  userIdParamSchema,
};

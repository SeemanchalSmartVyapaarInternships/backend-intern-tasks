const Joi = require('joi');
const { ALL_ROLES } = require('../config/roles');

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=]).{8,}$'))
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid id format' });

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: passwordRule.required(),
  role: Joi.string().valid(...ALL_ROLES).required(),
  isActive: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email(),
  role: Joi.string().valid(...ALL_ROLES),
  isActive: Joi.boolean(),
}).min(1);

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

const userIdParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid(...ALL_ROLES),
  isActive: Joi.boolean(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userIdParamSchema,
  listUsersQuerySchema,
};

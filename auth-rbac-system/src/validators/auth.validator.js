const Joi = require('joi');
const { ALL_ROLES, ROLES } = require('../config/roles');

/**
 * Reusable password complexity rule:
 * Minimum 8 characters, at least one uppercase, one lowercase,
 * one digit, and one special character.
 */
const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=]).{8,}$'))
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: passwordRule.required(),
  // Only EMPLOYEE/MANAGER selectable at public registration;
  // ADMIN/SUPER_ADMIN must be created via the admin user-management API.
  role: Joi.string()
    .valid(ROLES.EMPLOYEE, ROLES.MANAGER)
    .default(ROLES.EMPLOYEE),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(), // can also come from cookie
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordRule.required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordRule.required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  ALL_ROLES,
};

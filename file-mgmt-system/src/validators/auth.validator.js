/**
 * auth.validator.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Joi schemas for auth request bodies. Validated by
 *   middleware that calls `.validate()` and throws ApiError(400) on failure
 *   before the request ever reaches a controller/service — this is the
 *   first line of defense against malformed/malicious input.
 *
 * Connects with:
 *   - routes/auth.routes.js applies these via middleware/validate.js pattern
 *     (see validateBody usage inline in the route file).
 * ----------------------------------------------------------------------------
 */

const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().trim().email().max(191).required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

const updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
};

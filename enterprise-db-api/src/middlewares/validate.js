'use strict';

const AppError = require('./AppError');

/**
 * Returns an Express middleware that validates req.body against the given Joi schema.
 * On failure it passes a structured 400 AppError to next().
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,   // collect ALL validation errors at once
    stripUnknown: true   // drop any extra fields not in schema
  });

  if (!error) return next();

  const errors = error.details.map((d) => ({
    field:   d.context.label,
    message: d.message.replace(/['"]/g, '')
  }));

  return next(new AppError('Validation failed', 400, errors));
};

module.exports = validate;

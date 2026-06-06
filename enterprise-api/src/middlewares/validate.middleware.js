/**
 * src/middlewares/validate.middleware.js
 *
 * ARCHITECTURE DECISION:
 * We use Joi as the validation library.  This factory function accepts a
 * Joi schema and returns an Express middleware that validates the specified
 * request source (body / query / params).
 *
 * On validation failure → throws a 400 AppError with structured field errors.
 * On success            → strips unknown keys (security: prevents prototype pollution)
 *                         and assigns the cleaned object back onto the request.
 *
 * Usage:
 *   router.post('/', validate(createUserSchema), UserController.create);
 *   router.get('/',  validate(listUsersSchema, 'query'), UserController.list);
 */

'use strict';

const AppError = require('../utils/AppError');

/**
 * @param {import('joi').ObjectSchema} schema   – Joi schema to validate against
 * @param {'body'|'query'|'params'}   [source]  – which part of req to validate
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly:   false,   // collect ALL errors, not just the first
    allowUnknown: false,   // reject unknown keys
    stripUnknown: true,    // remove them after validation passes
  });

  if (error) {
    // Map Joi error details into our standard { field, message } shape
    const errors = error.details.map((detail) => ({
      field:   detail.context?.key || detail.path.join('.') || 'unknown',
      message: detail.message.replace(/['"]/g, ''), // strip Joi's quote decoration
    }));

    return next(AppError.badRequest('Validation failed', errors));
  }

  // Replace the request source with the sanitised, coerced value
  req[source] = value;
  return next();
};

module.exports = validate;

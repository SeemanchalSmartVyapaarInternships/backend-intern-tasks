/**
 * validate.middleware.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Factory that returns an Express middleware validating `req.body` or
 *   `req.query` against a given Joi schema. On failure, throws ApiError(400)
 *   with the list of field errors, which propagates to
 *   errorHandler.middleware.js.
 *
 * Connects with:
 *   - validators/auth.validator.js, validators/file.validator.js supply the
 *     schemas.
 *   - Used in routes/auth.routes.js and routes/file.routes.js.
 * ----------------------------------------------------------------------------
 */

const ApiError = require('../utils/ApiError');

/**
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'} source - which part of the request to validate
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(new ApiError(400, 'Validation failed', errors));
  }

  req[source] = value;
  next();
};

module.exports = validate;

const ApiError = require('../utils/ApiError');

/**
 * Generic request validation middleware factory.
 * Validates the specified part of the request (body, params, or query)
 * against the provided Joi schema. On failure, forwards a standardized
 * 400 ApiError with the full list of validation issues.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register);
 *   router.get('/users/:id', validate(userIdParamSchema, 'params'), controller.getUser);
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req[source] = value;
  return next();
};

module.exports = validate;

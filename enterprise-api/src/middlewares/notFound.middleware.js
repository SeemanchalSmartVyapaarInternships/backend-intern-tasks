/**
 * src/middlewares/notFound.middleware.js
 *
 * ARCHITECTURE DECISION:
 * This middleware is mounted AFTER all routes.  Any request that reaches it
 * means no route matched, so we throw a 404 AppError and let the global
 * error handler produce the standard response envelope.
 */

'use strict';

const AppError = require('../utils/AppError');

/**
 * @type {import('express').RequestHandler}
 */
const notFoundMiddleware = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundMiddleware;

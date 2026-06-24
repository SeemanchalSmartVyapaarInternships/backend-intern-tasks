'use strict';

const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('./AppError');

// ─── Sequelize-specific error translators ────────────────────────────────────

const handleSequelizeValidation = (err) => {
  const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  return new AppError('Database validation failed', 422, errors);
};

const handleUniqueConstraint = (err) => {
  const fields = err.errors.map((e) => e.path).join(', ');
  return new AppError(`Duplicate value for: ${fields}`, 409);
};

const handleForeignKeyConstraint = () =>
  new AppError('Referenced resource does not exist', 400);

// ─── Response helpers ─────────────────────────────────────────────────────────

const sendDev = (err, res) => {
  res.status(err.statusCode).json({
    success:    false,
    status:     err.status,
    message:    err.message,
    errors:     err.errors  || undefined,
    stack:      err.stack
  });
};

const sendProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status:  err.status,
      message: err.message,
      errors:  err.errors || undefined
    });
  }
  // Unknown / programming error — don't leak internals
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({
    success: false,
    status:  'error',
    message: 'Something went wrong. Please try again later.'
  });
};

// ─── Global error handler (4-arg signature required by Express) ───────────────

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  const env = process.env.NODE_ENV || 'development';

  if (env === 'development') {
    sendDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);

    if (error instanceof ValidationError)         error = handleSequelizeValidation(error);
    if (error instanceof UniqueConstraintError)   error = handleUniqueConstraint(error);
    if (error instanceof ForeignKeyConstraintError) error = handleForeignKeyConstraint();

    sendProd(error, res);
  }
};

module.exports = errorHandler;

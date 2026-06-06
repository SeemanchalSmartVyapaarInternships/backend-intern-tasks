/**
 * src/middlewares/requestLogger.middleware.js
 *
 * ARCHITECTURE DECISION:
 * We use Morgan as the HTTP access logger because it handles all the
 * edge-cases (response time, status, content-length) out of the box.
 * Its output is piped into Winston so all logs — app + HTTP — end up
 * in the same files with the same format.
 *
 * In production we use the compact 'combined' Apache format.
 * In development we use a coloured 'dev' format for readability.
 *
 * We also add a custom :requestId token so every access log line is
 * correlated to the request ID assigned by requestId.middleware.js.
 */

'use strict';

const morgan  = require('morgan');
const logger  = require('../utils/logger');
const config  = require('../config');

// Register a custom Morgan token that reads from res.locals
morgan.token('requestId', (req, res) => res.locals.requestId || '-');
morgan.token('body',      (req)      => {
  // Never log passwords or tokens even in development
  if (!req.body || Object.keys(req.body).length === 0) return '-';
  const safe = { ...req.body };
  ['password', 'passwordConfirm', 'token', 'secret'].forEach((k) => {
    if (safe[k]) safe[k] = '[REDACTED]';
  });
  return JSON.stringify(safe);
});

// Dev format: coloured, includes request body for easier debugging
const devFormat =
  ':requestId :method :url :status :response-time ms - :res[content-length] | body: :body';

// Production format: Apache combined (standard for log parsers)
const prodFormat = ':requestId :remote-addr - :remote-user [:date[clf]] ' +
  '":method :url HTTP/:http-version" :status :res[content-length] ' +
  '":referrer" ":user-agent"';

const requestLoggerMiddleware = morgan(
  config.isDev ? devFormat : prodFormat,
  { stream: logger.stream },
);

module.exports = requestLoggerMiddleware;

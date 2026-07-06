/**
 * logger.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Central Winston logger for application-level logs (server start, DB
 *   errors, uncaught exceptions). This is separate from the DB-backed
 *   audit_logs / api_logs tables — those record *business/security* events
 *   queried by admins through the API; this logger records *operational*
 *   events (crashes, startup, stack traces) to the console/files for
 *   developers.
 *
 * Connects with:
 *   - server.js (startup/shutdown logs)
 *   - middleware/errorHandler.middleware.js (logs stack traces on 5xx errors)
 * ----------------------------------------------------------------------------
 */

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`
    )
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;

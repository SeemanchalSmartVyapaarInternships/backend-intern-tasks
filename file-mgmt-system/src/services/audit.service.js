/**
 * audit.service.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Thin, safe wrapper around auditLog.model.js. Centralizing the "record an
 *   audit event" call here means:
 *     1. Every caller uses the same shape (action/module/description/status).
 *     2. Logging failures are swallowed (caught + logged to Winston) so a
 *        broken audit insert never crashes the actual user-facing request.
 *
 * Connects with:
 *   - Called from every controller after a meaningful action (register,
 *     login, file upload/delete/download, profile update, password change).
 *   - Called from middleware/errorHandler.middleware.js for API errors and
 *     unauthorized access.
 * ----------------------------------------------------------------------------
 */

const { createAuditLog, listAuditLogs } = require('../models/auditLog.model');
const logger = require('../utils/logger');

/**
 * recordAudit
 * @param {object} entry
 * @param {number|null} entry.userId
 * @param {string} entry.action     - e.g. 'LOGIN', 'FILE_UPLOAD', 'FILE_DELETE'
 * @param {string} entry.module     - e.g. 'AUTH', 'FILE', 'PROFILE'
 * @param {string} [entry.description]
 * @param {string} entry.httpMethod
 * @param {string} entry.endpoint
 * @param {string} entry.ipAddress
 * @param {'SUCCESS'|'FAILURE'} entry.status
 */
async function recordAudit(entry) {
  try {
    await createAuditLog(entry);
  } catch (err) {
    // Never let audit logging failures break the primary request flow.
    logger.error(`Failed to write audit log: ${err.message}`);
  }
}

/** Passthrough for admin listing (validation happens at controller level). */
async function getAuditLogs(filters) {
  return listAuditLogs(filters);
}

module.exports = { recordAudit, getAuditLogs };

/**
 * auditLog.model.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Data-access layer for the `audit_logs` table — the security/business
 *   event trail (logins, uploads, deletes, unauthorized access, etc).
 *
 * Connects with:
 *   - services/audit.service.js is the only writer.
 *   - controllers/audit.controller.js reads via listAuditLogs for GET /audit.
 * ----------------------------------------------------------------------------
 */

const { pool } = require('../config/db');

/** Insert one audit log entry. Never throws upward on failure paths that
 *  call this from the error handler — callers should catch internally so a
 *  logging failure never masks the original error. */
async function createAuditLog({
  userId = null,
  action,
  module,
  description = null,
  httpMethod,
  endpoint,
  ipAddress,
  status,
}) {
  await pool.query(
    `INSERT INTO audit_logs
      (user_id, action, module, description, http_method, endpoint, ip_address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, action, module, description, httpMethod, endpoint, ipAddress, status]
  );
}

/** Paginated, filterable audit log listing for admins. */
async function listAuditLogs({ userId, action, module, limit = 20, offset = 0 }) {
  const conditions = ['1=1'];
  const params = [];

  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (module) {
    conditions.push('module = ?');
    params.push(module);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT * FROM audit_logs WHERE ${whereClause}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM audit_logs WHERE ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
}

module.exports = { createAuditLog, listAuditLogs };

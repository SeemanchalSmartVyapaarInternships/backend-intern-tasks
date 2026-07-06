/**
 * apiLog.model.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Data-access layer for the `api_logs` table — a record of every API
 *   request's endpoint, method, response time, and status code.
 *
 * Connects with:
 *   - middleware/apiLogger.middleware.js is the only writer (runs on every
 *     request).
 *   - controllers/apiLog.controller.js reads for GET /api-logs.
 * ----------------------------------------------------------------------------
 */

const { pool } = require('../config/db');

/** Insert one API request log row. */
async function createApiLog({
  userId = null,
  endpoint,
  httpMethod,
  statusCode,
  responseTimeMs,
  ipAddress,
}) {
  await pool.query(
    `INSERT INTO api_logs (user_id, endpoint, http_method, status_code, response_time_ms, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, endpoint, httpMethod, statusCode, responseTimeMs, ipAddress]
  );
}

/** Paginated, filterable API log listing for admins. */
async function listApiLogs({ userId, statusCode, limit = 20, offset = 0 }) {
  const conditions = ['1=1'];
  const params = [];

  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }
  if (statusCode) {
    conditions.push('status_code = ?');
    params.push(statusCode);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT * FROM api_logs WHERE ${whereClause}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM api_logs WHERE ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
}

module.exports = { createApiLog, listApiLogs };

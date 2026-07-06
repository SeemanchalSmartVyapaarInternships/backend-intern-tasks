/**
 * loginLog.model.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Data-access layer for the `login_logs` table (login/logout history,
 *   including failed login attempts for security monitoring).
 *
 * Connects with:
 *   - services/auth.service.js writes on login/logout/failed-login.
 *   - controllers/loginHistory.controller.js reads for GET /login-history.
 * ----------------------------------------------------------------------------
 */

const { pool } = require('../config/db');

/** Insert a new login_logs row (called on every login attempt). */
async function createLoginLog({ userId, ipAddress, browser, device, loginStatus }) {
  const [result] = await pool.query(
    `INSERT INTO login_logs (user_id, login_time, ip_address, browser, device, login_status)
     VALUES (?, NOW(), ?, ?, ?, ?)`,
    [userId, ipAddress, browser, device, loginStatus]
  );
  return result.insertId;
}

/**
 * Stamp logout_time on the most recent open session for a user.
 * "Open" = login_status SUCCESS and logout_time still NULL.
 */
async function markLogout(userId) {
  await pool.query(
    `UPDATE login_logs
     SET logout_time = NOW()
     WHERE user_id = ? AND login_status = 'SUCCESS' AND logout_time IS NULL
     ORDER BY login_time DESC LIMIT 1`,
    [userId]
  );
}

/** Paginated login history, optionally filtered to one user. */
async function listLoginLogs({ userId, limit = 20, offset = 0 }) {
  const conditions = ['1=1'];
  const params = [];

  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT * FROM login_logs WHERE ${whereClause}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM login_logs WHERE ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
}

module.exports = { createLoginLog, markLogout, listLoginLogs };

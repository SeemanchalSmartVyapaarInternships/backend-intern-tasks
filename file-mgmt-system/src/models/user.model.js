/**
 * user.model.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Data-access layer for the `users` table. Every query is parameterized
 *   (using `?` placeholders) — this is what actually prevents SQL injection,
 *   never string-concatenate user input into SQL.
 *
 * Connects with:
 *   - services/auth.service.js calls these to register/authenticate users.
 *   - config/db.js supplies the connection pool used here.
 * ----------------------------------------------------------------------------
 */

const { pool } = require('../config/db');

/** Create a new user. Returns the inserted user's id. */
async function createUser({ fullName, email, passwordHash, role = 'user' }) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [fullName, email, passwordHash, role]
  );
  return result.insertId;
}

/** Find a user by email (used for login + duplicate-registration checks). */
async function findUserByEmail(email) {
  const [rows] = await pool.query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

/** Find a user by primary key. */
async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, full_name, email, role, is_active, last_login_at, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/** Update mutable profile fields (name only here; extend as needed). */
async function updateUserProfile(id, { fullName }) {
  await pool.query(`UPDATE users SET full_name = ? WHERE id = ?`, [fullName, id]);
}

/** Update the password hash (used by change-password flow). */
async function updateUserPassword(id, passwordHash) {
  await pool.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

/** Stamp last_login_at on successful login. */
async function touchLastLogin(id) {
  await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [id]);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  updateUserPassword,
  touchLastLogin,
};

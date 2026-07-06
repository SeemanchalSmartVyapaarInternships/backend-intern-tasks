/**
 * auth.service.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Business logic for registration, login, logout, and password changes.
 *   Handles password hashing (bcrypt), JWT issuing, and writes to
 *   login_logs on every login attempt (success or failure).
 *
 * Connects with:
 *   - models/user.model.js for user persistence.
 *   - models/loginLog.model.js for login/logout history.
 *   - controllers/auth.controller.js is the only caller.
 * ----------------------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');
const { createLoginLog, markLogout } = require('../models/loginLog.model');

const SALT_ROUNDS = 10;

/** Issue a signed JWT containing the user's id and role. */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/** Register a new user. Throws 409 if the email is already taken. */
async function registerUser({ fullName, email, password }) {
  const existing = await userModel.findUserByEmail(email);
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await userModel.createUser({ fullName, email, passwordHash });
  return userModel.findUserById(userId);
}

/**
 * Authenticate a user and record the attempt in login_logs regardless of
 * outcome (this is what powers failed-login monitoring).
 * Throws 401 on bad credentials.
 */
async function loginUser({ email, password, ipAddress, browser, device }) {
  const user = await userModel.findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    await createLoginLog({
      userId: user ? user.id : null,
      ipAddress,
      browser,
      device,
      loginStatus: 'FAILED',
    });
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.is_active) {
    await createLoginLog({
      userId: user.id, ipAddress, browser, device, loginStatus: 'FAILED',
    });
    throw new ApiError(403, 'This account has been deactivated');
  }

  await createLoginLog({
    userId: user.id, ipAddress, browser, device, loginStatus: 'SUCCESS',
  });
  await userModel.touchLastLogin(user.id);

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

/** Record a logout event by closing the user's most recent open session. */
async function logoutUser(userId) {
  await markLogout(userId);
}

/** Change password after verifying the current one. Throws 401 if wrong. */
async function changePassword(userId, currentPassword, newPassword) {
  const { pool } = require('../config/db');
  // findUserById intentionally excludes password_hash, so fetch it directly here.
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  const fullUser = rows[0];

  if (!fullUser || !(await bcrypt.compare(currentPassword, fullUser.password_hash))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userModel.updateUserPassword(userId, newHash);
}

module.exports = { registerUser, loginUser, logoutUser, changePassword, generateToken };

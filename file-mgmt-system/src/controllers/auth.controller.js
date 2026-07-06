/**
 * auth.controller.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   HTTP layer for authentication and profile endpoints. Each handler:
 *     1. Delegates business logic to services/auth.service.js (or
 *        models/user.model.js for simple reads).
 *     2. Records the corresponding audit log entry via audit.service.js.
 *     3. Sends a standardized ApiResponse.
 *
 * Connects with:
 *   - routes/auth.routes.js maps HTTP verbs/paths to these handlers.
 *   - services/auth.service.js, models/user.model.js for logic/data.
 *   - services/audit.service.js for the audit trail.
 * ----------------------------------------------------------------------------
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');
const userModel = require('../models/user.model');
const { recordAudit } = require('../services/audit.service');
const { getClientIp, parseUserAgent } = require('../utils/deviceParser');

/** POST /auth/register */
const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  await recordAudit({
    userId: user.id,
    action: 'USER_REGISTRATION',
    module: 'AUTH',
    description: `New user registered: ${user.email}`,
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  res.status(201).json(new ApiResponse(201, 'User registered successfully', user));
});

/** POST /auth/login */
const login = asyncHandler(async (req, res) => {
  const { browser, device } = parseUserAgent(req.headers['user-agent']);
  const { token, user } = await authService.loginUser({
    ...req.body,
    ipAddress: getClientIp(req),
    browser,
    device,
  });

  await recordAudit({
    userId: user.id,
    action: 'LOGIN',
    module: 'AUTH',
    description: `User logged in: ${user.email}`,
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  res.status(200).json(new ApiResponse(200, 'Login successful', { token, user }));
});

/** POST /auth/logout (protected) */
const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: 'LOGOUT',
    module: 'AUTH',
    description: `User logged out: ${req.user.email}`,
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  res.status(200).json(new ApiResponse(200, 'Logout successful'));
});

/** GET /auth/profile (protected) */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userModel.findUserById(req.user.id);
  res.status(200).json(new ApiResponse(200, 'Profile fetched successfully', user));
});

/** PUT /auth/profile (protected) */
const updateProfile = asyncHandler(async (req, res) => {
  await userModel.updateUserProfile(req.user.id, req.body);
  const user = await userModel.findUserById(req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: 'PROFILE_UPDATE',
    module: 'PROFILE',
    description: 'User updated profile details',
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  res.status(200).json(new ApiResponse(200, 'Profile updated successfully', user));
});

/** PUT /auth/change-password (protected) */
const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword
  );

  await recordAudit({
    userId: req.user.id,
    action: 'PASSWORD_CHANGE',
    module: 'PROFILE',
    description: 'User changed their password',
    httpMethod: req.method,
    endpoint: req.originalUrl,
    ipAddress: getClientIp(req),
    status: 'SUCCESS',
  });

  res.status(200).json(new ApiResponse(200, 'Password changed successfully'));
});

module.exports = { register, login, logout, getProfile, updateProfile, changePassword };

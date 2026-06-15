const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookie.util');

/**
 * Extracts request metadata (IP address, user agent) for session
 * auditing on refresh tokens.
 */
const getRequestMeta = (req) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);

  return new ApiResponse(201, 'User registered successfully', { user }).send(res);
});

/**
 * @desc    Authenticate user and issue access/refresh tokens
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, getRequestMeta(req));

  setAuthCookies(res, { accessToken, refreshToken });

  return new ApiResponse(200, 'Login successful', {
    user,
    accessToken,
    refreshToken,
  }).send(res);
});

/**
 * @desc    Exchange a valid refresh token for a new access/refresh token pair
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public (requires valid refresh token)
 */
const refreshToken = catchAsync(async (req, res) => {
  const rawRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  const { accessToken, refreshToken: newRefreshToken, user } = await authService.refreshTokens(
    rawRefreshToken,
    getRequestMeta(req)
  );

  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

  return new ApiResponse(200, 'Token refreshed successfully', {
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  }).send(res);
});

/**
 * @desc    Log out the current device (revokes the refresh token)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = catchAsync(async (req, res) => {
  const rawRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  await authService.logout(rawRefreshToken);
  clearAuthCookies(res);

  return new ApiResponse(200, 'Logged out successfully').send(res);
});

/**
 * @desc    Log out of all devices (revokes all refresh tokens for the user)
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
const logoutAll = catchAsync(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);

  return new ApiResponse(200, 'Logged out from all devices successfully').send(res);
});

/**
 * @desc    Request a password reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  return new ApiResponse(
    200,
    'If an account with that email exists, a password reset link has been sent'
  ).send(res);
});

/**
 * @desc    Reset password using a valid reset token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);

  return new ApiResponse(200, 'Password has been reset successfully. Please log in again').send(
    res
  );
});

/**
 * @desc    Change password for the currently authenticated user
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);

  clearAuthCookies(res);

  return new ApiResponse(
    200,
    'Password changed successfully. Please log in again with your new password'
  ).send(res);
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
};

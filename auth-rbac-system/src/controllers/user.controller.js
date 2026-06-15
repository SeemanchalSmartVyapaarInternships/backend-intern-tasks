const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/v1/profile
 * @access  Private (all authenticated roles)
 */
const getMyProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  return new ApiResponse(200, 'Profile retrieved successfully', { user }).send(res);
});

/**
 * @desc    Update the currently authenticated user's profile
 * @route   PATCH /api/v1/profile
 * @access  Private (all authenticated roles)
 */
const updateMyProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return new ApiResponse(200, 'Profile updated successfully', { user }).send(res);
});

/**
 * @desc    List all users (paginated, filterable by role/isActive)
 * @route   GET /api/v1/users
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const getUsers = catchAsync(async (req, res) => {
  const { users, total, page, limit, totalPages } = await userService.listUsers(req.query);

  return new ApiResponse(200, 'Users retrieved successfully', { users }, {
    total,
    page,
    limit,
    totalPages,
  }).send(res);
});

/**
 * @desc    Get a single user by id
 * @route   GET /api/v1/users/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return new ApiResponse(200, 'User retrieved successfully', { user }).send(res);
});

/**
 * @desc    Create a new user
 * @route   POST /api/v1/users
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.user, req.body);
  return new ApiResponse(201, 'User created successfully', { user }).send(res);
});

/**
 * @desc    Update an existing user
 * @route   PATCH /api/v1/users/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body);
  return new ApiResponse(200, 'User updated successfully', { user }).send(res);
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/v1/users/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.user, req.params.id);
  return new ApiResponse(200, 'User deleted successfully').send(res);
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

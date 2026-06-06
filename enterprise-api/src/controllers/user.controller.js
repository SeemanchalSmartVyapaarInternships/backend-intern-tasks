/**
 * src/controllers/user.controller.js
 *
 * ARCHITECTURE DECISION:
 * Controllers are deliberately thin.  They are responsible for:
 *   1. Extracting data from req (params, body, query)
 *   2. Calling the appropriate Service method
 *   3. Sending the response via ApiResponse
 *
 * They contain NO business logic.  If you find yourself writing an `if`
 * that doesn't relate to HTTP — move it to the service layer.
 *
 * catchAsync() eliminates try/catch: any thrown error automatically reaches
 * the global error handler via next().
 */

'use strict';

const UserService   = require('../services/user.service');
const ApiResponse   = require('../utils/ApiResponse');
const catchAsync    = require('../utils/catchAsync');

class UserController {
  /**
   * GET /users
   * List all users with optional filtering, sorting, and pagination.
   */
  listUsers = catchAsync(async (req, res) => {
    const { page, limit, role, search, sortBy, order } = req.query;

    const { users, totalItems } = await UserService.listUsers({
      page:    parseInt(page,  10),
      limit:   parseInt(limit, 10),
      role,
      search,
      sortBy,
      order,
    });

    return ApiResponse.success(res, {
      data:    users,
      message: 'Users retrieved successfully',
      meta:    ApiResponse.pagination(parseInt(page, 10), parseInt(limit, 10), totalItems),
    });
  });

  /**
   * GET /users/:id
   * Get a single user by UUID.
   */
  getUserById = catchAsync(async (req, res) => {
    const user = await UserService.getUserById(req.params.id);

    return ApiResponse.success(res, {
      data:    user,
      message: 'User retrieved successfully',
    });
  });

  /**
   * POST /users
   * Create a new user.
   */
  createUser = catchAsync(async (req, res) => {
    const user = await UserService.createUser(req.body);

    return ApiResponse.created(res, {
      data:    user,
      message: 'User created successfully',
    });
  });

  /**
   * PUT /users/:id
   * Update an existing user.
   */
  updateUser = catchAsync(async (req, res) => {
    const user = await UserService.updateUser(req.params.id, req.body);

    return ApiResponse.success(res, {
      data:    user,
      message: 'User updated successfully',
    });
  });

  /**
   * DELETE /users/:id
   * Soft- or hard-delete a user.
   */
  deleteUser = catchAsync(async (req, res) => {
    await UserService.deleteUser(req.params.id);

    return ApiResponse.success(res, {
      data:    null,
      message: 'User deleted successfully',
    });
  });
}

module.exports = new UserController();

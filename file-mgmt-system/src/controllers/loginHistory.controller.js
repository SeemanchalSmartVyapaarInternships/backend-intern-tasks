/**
 * loginHistory.controller.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   HTTP layer for GET /login-history — admin-only paginated login/logout
 *   history, optionally filtered to a single user.
 *
 * Connects with:
 *   - routes/loginHistory.routes.js (protected by auth + authorize('admin')).
 *   - models/loginLog.model.js for the query.
 * ----------------------------------------------------------------------------
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { listLoginLogs } = require('../models/loginLog.model');

/** GET /login-history?userId=&limit=&offset= */
const getLoginHistory = asyncHandler(async (req, res) => {
  const { userId, limit = 20, offset = 0 } = req.query;

  const { rows, total } = await listLoginLogs({
    userId: userId ? Number(userId) : undefined,
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(200, 'Login history fetched successfully', {
      logs: rows,
      total,
      limit: Number(limit),
      offset: Number(offset),
    })
  );
});

module.exports = { getLoginHistory };

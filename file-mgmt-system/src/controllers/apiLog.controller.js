/**
 * apiLog.controller.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   HTTP layer for GET /api-logs — admin-only paginated view of every API
 *   request logged by middleware/apiLogger.middleware.js.
 *
 * Connects with:
 *   - routes/apiLog.routes.js (protected by auth + authorize('admin')).
 *   - models/apiLog.model.js for the query.
 * ----------------------------------------------------------------------------
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { listApiLogs } = require('../models/apiLog.model');

/** GET /api-logs?userId=&statusCode=&limit=&offset= */
const getApiLogs = asyncHandler(async (req, res) => {
  const { userId, statusCode, limit = 20, offset = 0 } = req.query;

  const { rows, total } = await listApiLogs({
    userId: userId ? Number(userId) : undefined,
    statusCode: statusCode ? Number(statusCode) : undefined,
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(200, 'API logs fetched successfully', {
      logs: rows,
      total,
      limit: Number(limit),
      offset: Number(offset),
    })
  );
});

module.exports = { getApiLogs };

/**
 * audit.controller.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   HTTP layer for GET /audit — admin-only paginated/filterable audit trail
 *   listing. Read-only; the writes happen implicitly across the app via
 *   services/audit.service.js.
 *
 * Connects with:
 *   - routes/audit.routes.js (protected by auth + authorize('admin')).
 *   - services/audit.service.js for the actual query.
 * ----------------------------------------------------------------------------
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { getAuditLogs } = require('../services/audit.service');

/** GET /audit?userId=&action=&module=&limit=&offset= */
const listAuditLogs = asyncHandler(async (req, res) => {
  const { userId, action, module, limit = 20, offset = 0 } = req.query;

  const { rows, total } = await getAuditLogs({
    userId: userId ? Number(userId) : undefined,
    action,
    module,
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(200, 'Audit logs fetched successfully', {
      logs: rows,
      total,
      limit: Number(limit),
      offset: Number(offset),
    })
  );
});

module.exports = { listAuditLogs };

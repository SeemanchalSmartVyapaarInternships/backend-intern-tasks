/**
 * audit.routes.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Defines GET /audit, restricted to admins.
 *
 * Connects with:
 *   - controllers/audit.controller.js
 *   - middleware/auth.middleware.js + middleware/role.middleware.js
 *   - routes/index.js mounts this at /api/audit.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const { listAuditLogs } = require('../controllers/audit.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.get('/', authenticate, authorize('admin'), listAuditLogs);

module.exports = router;

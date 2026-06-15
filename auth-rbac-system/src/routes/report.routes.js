const express = require('express');
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../config/roles');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Aggregate reporting endpoints
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get aggregate user/role reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       403:
 *         description: Forbidden - insufficient role
 */
router.get(
  '/reports',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  reportController.getReports
);

module.exports = router;

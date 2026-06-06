/**
 * src/routes/health.routes.js
 *
 * ARCHITECTURE DECISION:
 * Health endpoints are essential for:
 *   • Container orchestrators (Kubernetes liveness / readiness probes)
 *   • Load balancer health checks
 *   • Monitoring dashboards
 *
 * /health/live  – Is the process running?
 * /health/ready – Is the app ready to serve traffic? (DB connected, etc.)
 */

'use strict';

const express     = require('express');
const ApiResponse = require('../utils/ApiResponse');
const config      = require('../config');

const router = express.Router();

/**
 * GET /health/live
 * Kubernetes liveness probe — just confirms the process is alive.
 */
router.get('/live', (req, res) => {
  ApiResponse.success(res, {
    data:    { status: 'UP' },
    message: 'Service is alive',
  });
});

/**
 * GET /health/ready
 * Readiness probe — checks all dependencies.
 * Add real DB ping / cache check here in production.
 */
router.get('/ready', (req, res) => {
  // In production, await a DB ping here and return 503 if it fails
  const checks = {
    status:  'UP',
    app:     config.appName,
    version: config.appVersion,
    env:     config.env,
    uptime:  `${Math.floor(process.uptime())}s`,
    memory: {
      heapUsed:  `${Math.round(process.memoryUsage().heapUsed  / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  };

  ApiResponse.success(res, {
    data:    checks,
    message: 'Service is ready',
  });
});

module.exports = router;

const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reportRoutes = require('./report.routes');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is up and running
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/', userRoutes); // exposes /profile and /users
router.use('/', reportRoutes); // exposes /reports

module.exports = router;

const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User.model');
const { ROLES } = require('../config/roles');

/**
 * @desc    Get aggregate reports (example protected resource)
 * @route   GET /api/v1/reports
 * @access  Private (SUPER_ADMIN, ADMIN, MANAGER)
 *
 * This is a demonstrative endpoint showing how a "Reports" module
 * might expose aggregate data restricted to management roles.
 */
const getReports = catchAsync(async (req, res) => {
  const [totalUsers, activeUsers, roleBreakdownRaw] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  const roleBreakdown = Object.values(ROLES).reduce((acc, role) => {
    const match = roleBreakdownRaw.find((r) => r._id === role);
    acc[role] = match ? match.count : 0;
    return acc;
  }, {});

  return new ApiResponse(200, 'Reports retrieved successfully', {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    roleBreakdown,
    generatedAt: new Date().toISOString(),
  }).send(res);
});

module.exports = { getReports };

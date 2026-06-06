const { sendSuccess } = require('../utils/apiResponse');
const config = require('../config');

const healthCheck = (req, res) => {
  sendSuccess(res, {
    status: 'healthy',
    environment: config.env,
    uptime: `${Math.floor(process.uptime())}s`,
    memoryUsage: process.memoryUsage(),
  }, 'API is running');
};

module.exports = { healthCheck };

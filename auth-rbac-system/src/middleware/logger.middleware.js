const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * HTTP request logging middleware.
 * Streams Morgan's "combined" style log lines into Winston so all
 * application and request logs are unified and written to the same
 * transports (console + log files).
 */
const stream = {
  write: (message) => logger.info(message.trim()),
};

const morganFormat =
  ':remote-addr :method :url :status :res[content-length] - :response-time ms';

const requestLogger = morgan(morganFormat, { stream });

module.exports = requestLogger;

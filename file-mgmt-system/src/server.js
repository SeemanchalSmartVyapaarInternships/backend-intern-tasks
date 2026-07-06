/**
 * server.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   The actual process entry point. Verifies the database is reachable
 *   BEFORE starting to accept HTTP traffic (fail-fast), then starts the
 *   HTTP server. Also registers process-level safety nets for unhandled
 *   promise rejections and uncaught exceptions so the process logs clearly
 *   and exits instead of hanging in a broken state.
 *
 * Connects with:
 *   - app.js supplies the configured Express app.
 *   - config/db.js supplies testConnection() for the startup check.
 *   - utils/logger.js for structured startup/shutdown logs.
 *
 * Run with: `node src/server.js` or `npm run dev` (nodemon)
 * ----------------------------------------------------------------------------
 */

require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    logger.info('MySQL connection pool verified successfully');

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Gracefully log and exit on unexpected failures instead of leaving the
    // process in a half-broken state that silently drops requests.
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

startServer();

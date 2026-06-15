const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

let server;

/**
 * Bootstraps the application:
 * 1. Connects to MongoDB
 * 2. Starts the HTTP server
 * 3. Wires up graceful shutdown and global error handlers
 */
const startServer = async () => {
  await connectDB();

  server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    logger.info(`API Documentation available at http://localhost:${config.port}/api-docs`);
  });
};

/**
 * Gracefully shuts down the HTTP server, allowing in-flight
 * requests to complete before exiting the process.
 */
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections and uncaught exceptions so the
// process does not silently crash without logging.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});

startServer();

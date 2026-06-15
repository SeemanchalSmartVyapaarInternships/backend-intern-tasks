/**
 * src/server.js
 *
 * ARCHITECTURE DECISION:
 * server.js is the process entry point.  Its only jobs are:
 *   1. Create the Express app
 *   2. Start the HTTP server
 *   3. Handle unhandled rejections & uncaught exceptions (last-resort safety net)
 *   4. Implement graceful shutdown (drain in-flight requests before exit)
 *
 * In production, unhandled rejections / exceptions should trigger a process
 * restart (via PM2 / systemd / Kubernetes).  We log them and exit with code 1.
 */

'use strict';

const createApp = require('./app');
const config    = require('./config');
const logger    = require('./utils/logger');

// ── Create & start server ─────────────────────────────────────────────────────

const app    = createApp();
const server = app.listen(config.port, () => {
  logger.info(`🚀 ${config.appName} v${config.appVersion} started`, {
    env:    config.env,
    port:   config.port,
    prefix: config.apiPrefix,
    pid:    process.pid,
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

/**
 * Gracefully shuts down the HTTP server.
 * Waits up to 10 s for in-flight requests to finish before forcefully exiting.
 *
 * @param {string} signal – OS signal name (SIGTERM, SIGINT)
 */
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown…`);

  server.close((err) => {
    if (err) {
      logger.error('Error during graceful shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 s if connections don't drain
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000).unref(); // .unref() so this timer doesn't prevent an earlier clean exit
}

// ── Process-level error guards ────────────────────────────────────────────────

/**
 * Unhandled promise rejections — e.g., `await somePromise` without try/catch.
 * In Node ≥ 15 the process crashes automatically; we log before it does.
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION — shutting down…', {
    reason:  reason instanceof Error ? reason.message : reason,
    stack:   reason instanceof Error ? reason.stack   : null,
    promise: String(promise),
  });
  // Trigger graceful shutdown so in-flight requests still finish
  gracefulShutdown('unhandledRejection');
});

/**
 * Uncaught synchronous exceptions — should never happen in well-written code,
 * but this is the last safety net.
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down…', {
    error: err.message,
    stack: err.stack,
  });
  // Hard exit: the process state may be corrupt
  process.exit(1);
});

// OS termination signals (SIGTERM from Docker/K8s, SIGINT from Ctrl+C)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

module.exports = server; // exported for Supertest in tests

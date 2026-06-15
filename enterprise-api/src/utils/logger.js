/**
 * src/utils/logger.js
 *
 * ARCHITECTURE DECISION:
 * We use Winston for structured, levelled logging.  All output is JSON in
 * production (machine-parseable by log aggregators like Datadog / Splunk)
 * and human-readable in development.  Daily log rotation prevents unbounded
 * disk growth.
 *
 * Usage anywhere in the codebase:
 *   const logger = require('../utils/logger');
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('Unhandled error', { error: err.message });
 */

'use strict';

const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// ── Custom formats ────────────────────────────────────────────────────────────

/** Adds a human-readable timestamp to every log entry */
const timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' });

/** Pretty-print for development console */
const devConsoleFormat = format.combine(
  timestampFormat,
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const rid = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level}${rid}: ${message}${metaStr}`;
  }),
);

/** Compact JSON for production / file transport */
const jsonFormat = format.combine(
  timestampFormat,
  format.errors({ stack: true }),  // include stack traces
  format.json(),
);

// ── Transports ────────────────────────────────────────────────────────────────

const logDir = path.resolve(config.logging.dir);

/** Rotate error logs daily — keep 30 days */
const errorFileTransport = new transports.DailyRotateFile({
  filename:    path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level:       'error',
  maxFiles:    '30d',
  zippedArchive: true,
  format:      jsonFormat,
});

/** Rotate combined logs daily — keep 14 days */
const combinedFileTransport = new transports.DailyRotateFile({
  filename:    path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles:    '14d',
  zippedArchive: true,
  format:      jsonFormat,
});

/** Console transport — human-readable in dev, JSON in prod */
const consoleTransport = new transports.Console({
  format: config.isDev ? devConsoleFormat : jsonFormat,
});

// ── Logger instance ───────────────────────────────────────────────────────────

const logger = createLogger({
  level:       config.logging.level,
  defaultMeta: {
    service: config.appName,
    version: config.appVersion,
    env:     config.env,
  },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  // Don't crash the process on unhandled logger exceptions
  exitOnError: false,
});

// ── Stream interface for Morgan HTTP logger ───────────────────────────────────
// Morgan writes a single line; we forward it to winston at 'http' level.
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;

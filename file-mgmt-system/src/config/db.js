/**
 * db.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Creates and exports a single MySQL connection pool (mysql2/promise) used
 *   by every model in the app. A pool (rather than one-off connections) is
 *   used because it reuses TCP connections, handles concurrency safely, and
 *   is the standard approach for production Node.js + MySQL apps.
 *
 * Connects with:
 *   - Every file in src/models/*  imports `pool` from here to run queries.
 *   - server.js calls `testConnection()` once at boot to fail fast if the
 *     database is unreachable, instead of discovering it on the first request.
 *
 * Security:
 *   - Uses parameterized queries everywhere (enforced at the model layer),
 *     which is what actually prevents SQL injection — this file just
 *     supplies the connection.
 * ----------------------------------------------------------------------------
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // return DATETIME columns as strings, not JS Date objects
});

/**
 * testConnection
 * Verifies the pool can actually reach MySQL. Called once at server startup.
 * Throws if it fails so server.js can log a clear error and exit instead of
 * starting a server that will fail on every request.
 */
async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

module.exports = { pool, testConnection };

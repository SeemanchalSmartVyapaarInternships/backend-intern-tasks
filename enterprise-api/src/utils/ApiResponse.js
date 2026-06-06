/**
 * src/utils/ApiResponse.js
 *
 * ARCHITECTURE DECISION:
 * Every HTTP response — success or error — leaves the server in the same
 * envelope shape.  Clients can therefore write a single response handler
 * rather than branching on status code.
 *
 * Envelope shape:
 * {
 *   "success": true | false,
 *   "statusCode": 200,
 *   "message": "Human-readable summary",
 *   "data": { … } | null,
 *   "errors": null | [ { field, message } ],
 *   "meta": { requestId, timestamp, version, pagination? },
 * }
 */

'use strict';

const config = require('../config');

class ApiResponse {
  /**
   * Send a successful response.
   *
   * @param {import('express').Response} res
   * @param {object}  options
   * @param {*}       options.data        – payload to return
   * @param {string}  [options.message]   – human-readable summary
   * @param {number}  [options.statusCode]– HTTP status (default 200)
   * @param {object}  [options.meta]      – extra meta (pagination etc.)
   */
  static success(res, { data = null, message = 'Success', statusCode = 200, meta = {} } = {}) {
    return res.status(statusCode).json({
      success:    true,
      statusCode,
      message,
      data,
      errors:     null,
      meta: {
        requestId: res.locals.requestId || null,
        timestamp: new Date().toISOString(),
        version:   config.appVersion,
        ...meta,
      },
    });
  }

  /**
   * Send a created (201) response.
   */
  static created(res, { data = null, message = 'Resource created successfully', meta = {} } = {}) {
    return ApiResponse.success(res, { data, message, statusCode: 201, meta });
  }

  /**
   * Send an error response.
   * Normally called by the global error handler — not directly in controllers.
   *
   * @param {import('express').Response} res
   * @param {object}  options
   * @param {string}  options.message
   * @param {number}  [options.statusCode]
   * @param {Array}   [options.errors]     – validation error list
   * @param {string}  [options.stack]      – stack trace (dev only)
   */
  static error(res, { message = 'Internal Server Error', statusCode = 500, errors = null, stack = null } = {}) {
    const body = {
      success:    false,
      statusCode,
      message,
      data:       null,
      errors,
      meta: {
        requestId: res.locals.requestId || null,
        timestamp: new Date().toISOString(),
        version:   config.appVersion,
      },
    };

    // Include stack trace only in development
    if (config.isDev && stack) body.stack = stack;

    return res.status(statusCode).json(body);
  }

  /**
   * Build a paginated meta block — attach to options.meta in success().
   *
   * @param {number} page       – current page (1-based)
   * @param {number} limit      – items per page
   * @param {number} totalItems – total record count
   */
  static pagination(page, limit, totalItems) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = ApiResponse;

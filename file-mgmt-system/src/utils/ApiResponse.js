/**
 * ApiResponse.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Standardizes the shape of every successful JSON response returned by the
 *   API, so clients always receive { success, statusCode, message, data }.
 *
 * Connects with:
 *   - Used in every controller via `res.status(x).json(new ApiResponse(...))`
 * ----------------------------------------------------------------------------
 */

class ApiResponse {
  constructor(statusCode, message = 'Success', data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;

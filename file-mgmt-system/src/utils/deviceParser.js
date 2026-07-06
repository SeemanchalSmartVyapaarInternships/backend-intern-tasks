/**
 * deviceParser.js
 * ----------------------------------------------------------------------------
 * Purpose:
 *   Small helper around `ua-parser-js` that turns a raw User-Agent header
 *   into a { browser, device } pair, and a helper to extract the real
 *   client IP address (accounting for reverse proxies via X-Forwarded-For).
 *
 * Connects with:
 *   - services/auth.service.js (login/logout) to populate login_logs
 *   - services/audit.service.js to populate audit_logs.ip_address
 *   - middleware/apiLogger.middleware.js to populate api_logs.ip_address
 * ----------------------------------------------------------------------------
 */

const { UAParser } = require('ua-parser-js');

/**
 * parseUserAgent
 * @param {string} userAgentHeader - raw `req.headers['user-agent']`
 * @returns {{browser: string, device: string}}
 */
function parseUserAgent(userAgentHeader = '') {
  const parser = new UAParser(userAgentHeader);
  const browserInfo = parser.getBrowser();
  const osInfo = parser.getOS();
  const deviceInfo = parser.getDevice();

  const browser = browserInfo.name
    ? `${browserInfo.name} ${browserInfo.version || ''}`.trim()
    : 'Unknown Browser';

  const device = deviceInfo.type
    ? `${deviceInfo.vendor || ''} ${deviceInfo.model || ''} (${deviceInfo.type})`.trim()
    : `${osInfo.name || 'Unknown OS'} ${osInfo.version || ''}`.trim();

  return { browser, device };
}

/**
 * getClientIp
 * Resolves the originating client IP, preferring the X-Forwarded-For header
 * (set by proxies/load balancers) and falling back to the raw socket address.
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'UNKNOWN';
}

module.exports = { parseUserAgent, getClientIp };

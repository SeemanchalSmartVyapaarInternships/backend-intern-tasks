const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Email Service
 * Wraps Nodemailer to send transactional emails (password reset, etc.).
 * In non-production environments without SMTP credentials configured,
 * emails are logged instead of sent, to ease local development.
 */
class EmailService {
  constructor() {
    this.transporter = null;

    if (config.smtp.host && config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      logger.warn('SMTP not configured. Emails will be logged instead of sent.');
    }
  }

  /**
   * Sends a generic email.
   * @param {{ to: string, subject: string, html: string, text?: string }} options
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      logger.info(`[EMAIL - DEV MODE] To: ${to} | Subject: ${subject}\n${text || html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
        text,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sends a password reset email containing a tokenized link.
   */
  async sendPasswordResetEmail(user, resetUrl) {
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in ${config.passwordReset.expiresInMinutes} minutes.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
        </p>
        <p>If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
        <p>If the button above does not work, copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
      </div>
    `;
    const text = `Hi ${user.name}, reset your password using this link (valid for ${config.passwordReset.expiresInMinutes} minutes): ${resetUrl}`;

    await this.sendEmail({ to: user.email, subject, html, text });
  }
}

module.exports = new EmailService();

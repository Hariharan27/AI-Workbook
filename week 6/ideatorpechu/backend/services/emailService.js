const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.EMAIL_FROM || 'IdeatorPechu <noreply@ideatorpechu.com>';
    this.appName = process.env.APP_NAME || 'IdeatorPechu';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  async initialize() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email configuration not found. Using development mode with console logging.');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Email service initialization failed:', error);
      console.log('Email service will use console logging for development.');
      this.transporter = null;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      // If no transporter (development mode), log the email instead
      if (!this.transporter) {
        console.log('=== EMAIL WOULD BE SENT (Development Mode) ===');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content:', text || this.stripHtml(html));
        console.log('=============================================');
        return { messageId: 'dev-mode-' + Date.now() };
      }

      const mailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      // Don't throw error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Email error ignored in development mode');
        return { messageId: 'error-' + Date.now() };
      }
      throw error;
    }
  }

  // Strip HTML tags for plain text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Welcome email template
  async sendWelcomeEmail(user) {
    const subject = `வணக்கம் ${user.firstName}! Welcome to ${this.appName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>வணக்கம் ${user.firstName}!</h1>
            <h2>Welcome to ${this.appName}</h2>
          </div>
          <div class="content">
            <p>Dear ${user.firstName},</p>
            <p>Thank you for joining ${this.appName}! We're excited to have you as part of our community.</p>
            <p>Your account has been created successfully with username: <strong>${user.username}</strong></p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <a href="${this.appUrl}/verify-email?token=${user.emailVerificationToken}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${this.appUrl}/verify-email?token=${user.emailVerificationToken}</p>
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Email verification template
  async sendVerificationEmail(user, verificationToken) {
    const subject = `Verify your ${this.appName} account`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Account</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>Please verify your email address to complete your ${this.appName} account setup.</p>
            <a href="${this.appUrl}/verify-email?token=${verificationToken}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${this.appUrl}/verify-email?token=${verificationToken}</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Password reset email template
  async sendPasswordResetEmail(user, resetToken) {
    const subject = `Reset your ${this.appName} password`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password for your ${this.appName} account.</p>
            <a href="${this.appUrl}/reset-password?token=${resetToken}" class="button">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${this.appUrl}/reset-password?token=${resetToken}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>For security reasons, this link will expire in 1 hour.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Follow notification email template
  async sendFollowNotificationEmail(user, follower) {
    const subject = `${follower.firstName} started following you on ${this.appName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Follower</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Follower!</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p><strong>${follower.firstName} ${follower.lastName}</strong> (@${follower.username}) started following you on ${this.appName}!</p>
            <a href="${this.appUrl}/profile/${follower.username}" class="button">View Profile</a>
            <p>Best regards,<br>The ${this.appName} Team</p>
          </div>
          <div class="footer">
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Account security alert email template
  async sendSecurityAlertEmail(user, activity) {
    const subject = `Security Alert - ${this.appName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Security Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>We detected unusual activity on your ${this.appName} account:</p>
            <p><strong>${activity}</strong></p>
            <p>If this was you, you can ignore this email. If not, please secure your account immediately.</p>
            <a href="${this.appUrl}/account/security" class="button">Secure Account</a>
            <p>Best regards,<br>The ${this.appName} Security Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

const emailService = new EmailService();

module.exports = emailService; 
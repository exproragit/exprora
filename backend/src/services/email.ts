/**
 * Email service for notifications
 * Supports multiple providers (SendGrid, AWS SES, etc.)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private provider: string;

  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'console'; // console, sendgrid, ses
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid(options);
        case 'ses':
          return await this.sendViaSES(options);
        default:
          return await this.sendViaConsole(options);
      }
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  private async sendViaConsole(options: EmailOptions): Promise<boolean> {
    console.log('📧 Email (Console Mode):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body:', options.text || options.html);
    return true;
  }

  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    // TODO: Implement SendGrid integration
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ ...options, from: process.env.EMAIL_FROM });
    return this.sendViaConsole(options); // Fallback for now
  }

  private async sendViaSES(options: EmailOptions): Promise<boolean> {
    // TODO: Implement AWS SES integration
    return this.sendViaConsole(options); // Fallback for now
  }

  // Pre-built email templates
  async sendExperimentCompleted(accountId: number, experimentId: number, experimentName: string) {
    const accountResult = await import('../database/connection').then(m => m.default.query(
      'SELECT email, company_name FROM accounts WHERE id = $1',
      [accountId]
    ));

    if (accountResult.rows.length === 0) return false;

    const account = accountResult.rows[0];
    const dashboardUrl = `${process.env.FRONTEND_URL}/experiments/${experimentId}`;

    return await this.send({
      to: account.email,
      subject: `Experiment Completed: ${experimentName}`,
      html: `
        <h2>Your Experiment Has Completed</h2>
        <p>Hi ${account.company_name},</p>
        <p>Your experiment "<strong>${experimentName}</strong>" has completed.</p>
        <p><a href="${dashboardUrl}">View Results</a></p>
      `,
      text: `Your experiment "${experimentName}" has completed. View results: ${dashboardUrl}`,
    });
  }

  async sendConversionGoalReached(accountId: number, experimentId: number, goalName: string) {
    const accountResult = await import('../database/connection').then(m => m.default.query(
      'SELECT email, company_name FROM accounts WHERE id = $1',
      [accountId]
    ));

    if (accountResult.rows.length === 0) return false;

    const account = accountResult.rows[0];
    const dashboardUrl = `${process.env.FRONTEND_URL}/experiments/${experimentId}`;

    return await this.send({
      to: account.email,
      subject: `Conversion Goal Reached: ${goalName}`,
      html: `
        <h2>Conversion Goal Reached!</h2>
        <p>Hi ${account.company_name},</p>
        <p>Your experiment has reached the conversion goal: <strong>${goalName}</strong></p>
        <p><a href="${dashboardUrl}">View Results</a></p>
      `,
      text: `Your experiment reached the conversion goal: ${goalName}. View results: ${dashboardUrl}`,
    });
  }

  async sendPasswordReset(accountId: number, resetToken: string) {
    const accountResult = await import('../database/connection').then(m => m.default.query(
      'SELECT email, company_name FROM accounts WHERE id = $1',
      [accountId]
    ));

    if (accountResult.rows.length === 0) return false;

    const account = accountResult.rows[0];
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return await this.send({
      to: account.email,
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${account.company_name},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}`,
    });
  }
}

export default new EmailService();


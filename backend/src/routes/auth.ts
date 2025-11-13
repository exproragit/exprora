import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection';
import { authenticateClient, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/schemas';
import { ValidationError } from '../utils/errors';

const router = express.Router();

// Request password reset
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: express.Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query(
      'SELECT id FROM accounts WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If email exists, reset link has been sent' });
    }

    const accountId = result.rows[0].id;
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await pool.query(
      `INSERT INTO password_reset_tokens (account_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [accountId, token, expiresAt]
    );

    // TODO: Send email with reset link
    // For now, return token (in production, send via email)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    res.json({
      message: 'Password reset link sent',
      // Remove this in production - only for development
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (error) {
    throw error;
  }
});

// Reset password with token
router.post('/reset-password', validate(resetPasswordSchema), async (req: express.Request, res: Response) => {
  try {
    const { token, new_password } = req.body;

    // Find valid token
    const tokenResult = await pool.query(
      `SELECT account_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = false`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const accountId = tokenResult.rows[0].account_id;

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      'UPDATE accounts SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, accountId]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    throw error;
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req: express.Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT account_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired token' });
    }

    res.json({ valid: true });
  } catch (error) {
    throw error;
  }
});

export default router;


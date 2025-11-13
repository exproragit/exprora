import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { authenticateClient, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { signupSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../validators/schemas';
import { ConflictError, AuthenticationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();

// Client Signup
router.post('/signup', validate(signupSchema), async (req: express.Request, res: Response) => {
  try {
    const { company_name, email, password, domain } = req.body;

    if (!company_name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate API key
    const { v4: uuidv4 } = await import('uuid');
    const apiKey = `expr_${uuidv4().replace(/-/g, '')}`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Set trial period (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const result = await pool.query(
      `INSERT INTO accounts 
       (company_name, email, password_hash, api_key, domain, subscription_plan, subscription_status, trial_ends_at)
       VALUES ($1, $2, $3, $4, $5, 'starter', 'trial', $6)
       RETURNING id, company_name, email, api_key, subscription_plan, subscription_status, created_at`,
      [company_name, email, passwordHash, apiKey, domain || null, trialEndsAt]
    );

    // Generate JWT token
    const token = jwt.sign(
      { accountId: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    const requestId = (req as any).requestId;
    logger.info('Account created', { accountId: result.rows[0].id, email, requestId });

    res.status(201).json({
      token,
      account: {
        id: result.rows[0].id,
        company_name: result.rows[0].company_name,
        email: result.rows[0].email,
        api_key: result.rows[0].api_key,
        subscription_plan: result.rows[0].subscription_plan,
        subscription_status: result.rows[0].subscription_status
      }
    });
  } catch (error: any) {
    if (error.code === '23505') {
      throw new ConflictError('Email already exists');
    }
    throw error;
  }
});

// Client Login
router.post('/login', validate(loginSchema), async (req: express.Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM accounts WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid credentials');
    }

    const account = result.rows[0];
    const isValid = await bcrypt.compare(password, account.password_hash);

    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = jwt.sign(
      { accountId: account.id, email: account.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      token,
      account: {
        id: account.id,
        company_name: account.company_name,
        email: account.email,
        api_key: account.api_key,
        subscription_plan: account.subscription_plan,
        subscription_status: account.subscription_status,
        domain: account.domain
      }
    });
  } catch (error) {
    throw error;
  }
});

// Get client profile
router.get('/profile', authenticateClient, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, company_name, email, domain, api_key, subscription_plan, 
              subscription_status, billing_cycle, trial_ends_at, subscription_ends_at, created_at
       FROM accounts WHERE id = $1`,
      [req.accountId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account');
    }

    res.json({ account: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

// Update client profile
router.patch('/profile', authenticateClient, validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { company_name, domain } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (company_name) {
      updates.push(`company_name = $${paramCount}`);
      values.push(company_name);
      paramCount++;
    }

    if (domain !== undefined) {
      updates.push(`domain = $${paramCount}`);
      values.push(domain);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.accountId);
    const query = `UPDATE accounts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({ account: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

// Change password
router.post('/change-password', authenticateClient, validate(changePasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await pool.query(
      'SELECT password_hash FROM accounts WHERE id = $1',
      [req.accountId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account');
    }

    const isValid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE accounts SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.accountId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    throw error;
  }
});

// Get client dashboard stats
router.get('/dashboard', authenticateClient, async (req: AuthRequest, res: Response) => {
  try {
    // Experiment stats
    const experimentsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'running') as active,
        COUNT(*) FILTER (WHERE status = 'paused') as paused,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
       FROM experiments
       WHERE account_id = $1`,
      [req.accountId]
    );

    // Visitor stats
    const visitorsResult = await pool.query(
      `SELECT COUNT(DISTINCT visitor_id) as total_visitors
       FROM visitors
       WHERE account_id = $1`,
      [req.accountId]
    );

    // Conversion stats (last 30 days)
    const conversionsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT visitor_id) as unique_conversions,
        COUNT(*) as total_conversions,
        SUM(event_value) as total_revenue
       FROM events
       WHERE account_id = $1 
         AND event_type = 'conversion'
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.accountId]
    );

    // Recent experiments
    const recentExperimentsResult = await pool.query(
      `SELECT id, name, status, type, created_at
       FROM experiments
       WHERE account_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.accountId]
    );

    res.json({
      experiments: experimentsResult.rows[0],
      visitors: visitorsResult.rows[0],
      conversions: conversionsResult.rows[0],
      recentExperiments: recentExperimentsResult.rows
    });
  } catch (error) {
    throw error;
  }
});

// Get embed code for client website
router.get('/embed-code', authenticateClient, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT api_key FROM accounts WHERE id = $1',
      [req.accountId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account');
    }

    const apiKey = result.rows[0].api_key;
    // Use backend URL for SDK - Railway will provide this via RAILWAY_PUBLIC_DOMAIN
    const sdkUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/sdk.js`
      : process.env.API_URL 
      ? `${process.env.API_URL}/sdk.js`
      : 'https://exprora.com/sdk.js';
    
    const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${sdkUrl}';
    script.async = true;
    script.onload = function() {
      if (typeof Exprora !== 'undefined') {
        Exprora.init('${apiKey}');
      }
    };
    document.head.appendChild(script);
  })();
</script>`;

    res.json({ 
      embed_code: embedCode,
      api_key: apiKey,
      instructions: 'Copy and paste this code before the closing </head> tag of your website'
    });
  } catch (error) {
    throw error;
  }
});

export default router;


import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all clients (dashboard overview)
router.get('/clients', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        a.id, a.company_name, a.email, a.domain, a.subscription_plan,
        a.subscription_status, a.billing_cycle, a.created_at,
        COUNT(DISTINCT e.id) as total_experiments,
        COUNT(DISTINCT CASE WHEN e.status = 'running' THEN e.id END) as active_experiments
      FROM accounts a
      LEFT JOIN experiments e ON e.account_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (a.company_name ILIKE $${paramCount} OR a.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND a.subscription_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` GROUP BY a.id ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM accounts');

    res.json({
      clients: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get client details
router.get('/clients/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const accountResult = await pool.query(
      `SELECT a.*, 
        COUNT(DISTINCT e.id) as total_experiments,
        COUNT(DISTINCT CASE WHEN e.status = 'running' THEN e.id END) as active_experiments
       FROM accounts a
       LEFT JOIN experiments e ON e.account_id = a.id
       WHERE a.id = $1
       GROUP BY a.id`,
      [id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get revenue data
    const revenueResult = await pool.query(
      `SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_revenue
       FROM invoices
       WHERE account_id = $1`,
      [id]
    );

    // Get recent activity
    const activityResult = await pool.query(
      `SELECT * FROM client_activity_log
       WHERE account_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      client: accountResult.rows[0],
      revenue: revenueResult.rows[0],
      recentActivity: activityResult.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new client account
router.post('/clients', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { company_name, email, password, domain, subscription_plan, trial_days = 14 } = req.body;

    if (!company_name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate API key
    const { v4: uuidv4 } = await import('uuid');
    const apiKey = `expr_${uuidv4().replace(/-/g, '')}`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trial_days);

    const result = await pool.query(
      `INSERT INTO accounts 
       (company_name, email, password_hash, api_key, domain, subscription_plan, subscription_status, trial_ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'trial', $7)
       RETURNING id, company_name, email, api_key, subscription_plan, subscription_status, created_at`,
      [company_name, email, passwordHash, apiKey, domain || null, subscription_plan || 'starter', trialEndsAt]
    );

    // Log activity
    await pool.query(
      `INSERT INTO admin_activity_log (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'create_client', 'account', $2, $3)`,
      [req.userId, result.rows[0].id, JSON.stringify({ company_name, email })]
    );

    res.status(201).json({ client: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update client subscription
router.patch('/clients/:id/subscription', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { subscription_plan, subscription_status, billing_cycle } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (subscription_plan) {
      updates.push(`subscription_plan = $${paramCount}`);
      values.push(subscription_plan);
      paramCount++;
    }

    if (subscription_status) {
      updates.push(`subscription_status = $${paramCount}`);
      values.push(subscription_status);
      paramCount++;
    }

    if (billing_cycle) {
      updates.push(`billing_cycle = $${paramCount}`);
      values.push(billing_cycle);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `UPDATE accounts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    let dateFormat = 'YYYY-MM-DD';
    if (period === 'month') dateFormat = 'YYYY-MM';
    if (period === 'year') dateFormat = 'YYYY';

    const revenueResult = await pool.query(
      `SELECT 
        DATE_TRUNC($1, invoice_date) as period,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_revenue,
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices
       FROM invoices
       WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY DATE_TRUNC($1, invoice_date)
       ORDER BY period DESC`,
      [period]
    );

    // Get subscription stats
    const statsResult = await pool.query(
      `SELECT 
        subscription_status,
        COUNT(*) as count,
        subscription_plan,
        COUNT(*) FILTER (WHERE subscription_plan = 'starter') as starter_count,
        COUNT(*) FILTER (WHERE subscription_plan = 'professional') as professional_count,
        COUNT(*) FILTER (WHERE subscription_plan = 'enterprise') as enterprise_count
       FROM accounts
       GROUP BY subscription_status, subscription_plan`
    );

    const totalRevenueResult = await pool.query(
      `SELECT 
        SUM(amount) as total,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_total
       FROM invoices`
    );

    res.json({
      revenue: revenueResult.rows,
      stats: statsResult.rows,
      totals: totalRevenueResult.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard overview
router.get('/dashboard', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Total clients
    const clientsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE subscription_status = 'active') as active,
        COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial,
        COUNT(*) FILTER (WHERE subscription_status = 'cancelled') as cancelled
       FROM accounts`
    );

    // Total revenue
    const revenueResult = await pool.query(
      `SELECT 
        SUM(amount) as total_revenue,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_revenue,
        SUM(CASE WHEN invoice_date >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as monthly_revenue
       FROM invoices`
    );

    // Total experiments across all clients
    const experimentsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'running') as active
       FROM experiments`
    );

    // Recent clients
    const recentClientsResult = await pool.query(
      `SELECT id, company_name, email, subscription_plan, subscription_status, created_at
       FROM accounts
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      clients: clientsResult.rows[0],
      revenue: revenueResult.rows[0],
      experiments: experimentsResult.rows[0],
      recentClients: recentClientsResult.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


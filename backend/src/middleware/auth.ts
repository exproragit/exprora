import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  accountId?: number;
  isAdmin?: boolean;
  body: any;
  query: any;
  params: any;
}

// Client authentication middleware
export const authenticateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.accountId = decoded.accountId;
    req.userId = decoded.userId;
    req.isAdmin = false;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin authentication middleware
export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;
    req.userId = decoded.adminId;
    req.isAdmin = true;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
};

// API Key authentication (for SDK)
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const pool = (await import('../database/connection')).default;
    const result = await pool.query(
      'SELECT id, subscription_status FROM accounts WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const account = result.rows[0];
    if (account.subscription_status !== 'active' && account.subscription_status !== 'trial') {
      return res.status(403).json({ error: 'Account subscription is not active' });
    }

    req.accountId = account.id;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};


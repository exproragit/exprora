import express, { Response } from 'express';
import pool from '../database/connection';
import { authenticateApiKey, AuthRequest } from '../middleware/auth';
import { authenticateClient } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { recordingSaveSchema } from '../validators/schemas';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

// Save session recording (called by SDK)
router.post('/save', authenticateApiKey, validate(recordingSaveSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      visitor_id,
      session_id,
      page_url,
      recording_data,
      duration,
      page_views,
    } = req.body;

    await pool.query(
      `INSERT INTO session_recordings 
       (account_id, visitor_id, session_id, page_url, recording_data, duration, page_views)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.accountId,
        visitor_id,
        session_id,
        page_url,
        JSON.stringify(recording_data),
        duration || null,
        page_views || 1,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// Get session recordings (for dashboard)
router.get('/', authenticateClient, async (req: AuthRequest, res: Response) => {
  try {
    const { page_url, visitor_id, limit = 50 } = req.query;

    let query = `
      SELECT id, visitor_id, session_id, page_url, duration, page_views, created_at
      FROM session_recordings
      WHERE account_id = $1
    `;
    const params: any[] = [req.accountId];
    let paramCount = 2;

    if (page_url) {
      query += ` AND page_url = $${paramCount}`;
      params.push(page_url);
      paramCount++;
    }

    if (visitor_id) {
      query += ` AND visitor_id = $${paramCount}`;
      params.push(visitor_id);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);

    res.json({ recordings: result.rows });
  } catch (error) {
    throw error;
  }
});

// Get single recording
router.get('/:id', authenticateClient, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM session_recordings 
       WHERE id = $1 AND account_id = $2`,
      [id, req.accountId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Recording');
    }

    res.json({ recording: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

export default router;


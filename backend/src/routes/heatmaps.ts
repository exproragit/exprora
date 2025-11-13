import express, { Response } from 'express';
import pool from '../database/connection';
import { authenticateApiKey, AuthRequest } from '../middleware/auth';
import { authenticateClient } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { heatmapTrackSchema, heatmapQuerySchema } from '../validators/schemas';
import { logger } from '../utils/logger';

const router = express.Router();

// Track heatmap data (called by SDK)
router.post('/track', authenticateApiKey, validate(heatmapTrackSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      page_url,
      x_coordinate,
      y_coordinate,
      scroll_depth,
      element_selector,
      experiment_id,
      event_type, // 'click', 'scroll', 'move'
    } = req.body;

    // For clicks, increment count if same location exists
    if (event_type === 'click') {
      const existing = await pool.query(
        `SELECT id, click_count FROM heatmap_data 
         WHERE account_id = $1 AND page_url = $2 
         AND x_coordinate = $3 AND y_coordinate = $4
         AND experiment_id = $5
         LIMIT 1`,
        [req.accountId, page_url, x_coordinate, y_coordinate, experiment_id || null]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE heatmap_data 
           SET click_count = click_count + 1, created_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [existing.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO heatmap_data 
           (account_id, experiment_id, page_url, x_coordinate, y_coordinate, 
            click_count, scroll_depth, element_selector)
           VALUES ($1, $2, $3, $4, $5, 1, $6, $7)`,
          [
            req.accountId,
            experiment_id || null,
            page_url,
            x_coordinate,
            y_coordinate,
            scroll_depth || null,
            element_selector || null,
          ]
        );
      }
    } else {
      // For scroll and move events, just insert
      await pool.query(
        `INSERT INTO heatmap_data 
         (account_id, experiment_id, page_url, x_coordinate, y_coordinate, 
          scroll_depth, element_selector)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.accountId,
          experiment_id || null,
          page_url,
          x_coordinate,
          y_coordinate,
          scroll_depth || null,
          element_selector || null,
        ]
      );
    }

    res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// Get heatmap data (for dashboard)
router.get('/', authenticateClient, validateQuery(heatmapQuerySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { page_url, experiment_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        x_coordinate,
        y_coordinate,
        SUM(click_count) as total_clicks,
        AVG(scroll_depth) as avg_scroll_depth,
        COUNT(*) as event_count
      FROM heatmap_data
      WHERE account_id = $1
    `;
    const params: any[] = [req.accountId];
    let paramCount = 2;

    if (page_url) {
      query += ` AND page_url = $${paramCount}`;
      params.push(page_url);
      paramCount++;
    }

    if (experiment_id) {
      query += ` AND experiment_id = $${paramCount}`;
      params.push(experiment_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY x_coordinate, y_coordinate ORDER BY total_clicks DESC LIMIT 1000`;

    const result = await pool.query(query, params);

    res.json({ heatmap_data: result.rows });
  } catch (error) {
    throw error;
  }
});

export default router;


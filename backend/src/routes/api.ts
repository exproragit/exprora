import express, { Response } from 'express';
import pool from '../database/connection';
import { authenticateApiKey, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { validate, validateQuery } from '../middleware/validation';
import { visitorInitSchema, trackEventSchema, activeExperimentsQuerySchema, recordingSaveSchema } from '../validators/schemas';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();

// Note: Heatmap tracking is handled in /api/client/heatmaps/track
// This endpoint is removed to avoid duplication

// All routes require API key authentication
router.use(authenticateApiKey);

// Initialize visitor (called by SDK)
router.post('/visitor/init', validate(visitorInitSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { visitor_id, session_id, user_agent, ip_address } = req.body;

    // Upsert visitor
    await pool.query(
      `INSERT INTO visitors (account_id, visitor_id, session_id, user_agent, ip_address, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (account_id, visitor_id) 
       DO UPDATE SET session_id = $3, last_seen_at = CURRENT_TIMESTAMP`,
      [req.accountId, visitor_id, session_id || null, user_agent || null, ip_address || null]
    );

    res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// Get active experiments for a visitor
router.get('/experiments/active', validateQuery(activeExperimentsQuerySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { visitor_id, url } = req.query;

    // Get all running experiments for this account
    const experimentsResult = await pool.query(
      `SELECT e.id, e.name, e.type, e.traffic_allocation, e.targeting_rules,
              v.id as variant_id, v.name as variant_name, v.type as variant_type,
              v.changes, v.custom_code, v.css_code, v.js_code, v.is_control
       FROM experiments e
       INNER JOIN variants v ON v.experiment_id = e.id
       WHERE e.account_id = $1 
         AND e.status = 'running'
         AND (e.start_date IS NULL OR e.start_date <= CURRENT_TIMESTAMP)
         AND (e.end_date IS NULL OR e.end_date >= CURRENT_TIMESTAMP)
       ORDER BY e.created_at DESC`,
      [req.accountId]
    );

    // Check if visitor is already assigned to any experiment
    const assignmentsResult = await pool.query(
      `SELECT experiment_id, variant_id
       FROM experiment_assignments
       WHERE account_id = $1 AND visitor_id = $2`,
      [req.accountId, visitor_id]
    );

    const assignments = new Map(
      assignmentsResult.rows.map((row: any) => [row.experiment_id, row.variant_id])
    );

    // Filter and assign experiments
    const activeExperiments: any[] = [];
    const experimentsByExperimentId = new Map<number, any[]>();

    experimentsResult.rows.forEach((row: any) => {
      if (!experimentsByExperimentId.has(row.id)) {
        experimentsByExperimentId.set(row.id, []);
      }
      experimentsByExperimentId.get(row.id)!.push(row);
    });

    for (const [experimentId, variants] of experimentsByExperimentId) {
      // Check if visitor already assigned
      if (assignments.has(experimentId)) {
        const assignedVariantId = assignments.get(experimentId);
        const variant = variants.find((v: any) => v.variant_id === assignedVariantId);
        if (variant) {
          activeExperiments.push({
            experiment_id: experimentId,
            experiment_name: variant.name,
            variant_id: variant.variant_id,
            variant_name: variant.variant_name,
            changes: variant.changes,
            custom_code: variant.custom_code,
            css_code: variant.css_code,
            js_code: variant.js_code,
            is_control: variant.is_control
          });
        }
        continue;
      }

      // Check traffic allocation (simple random assignment)
      const experiment = variants[0];
      const random = Math.random() * 100;
      if (random > experiment.traffic_allocation) {
        continue; // Skip this experiment
      }

      // Simple variant assignment (can be improved with consistent hashing)
      const totalPercentage = variants.reduce((sum: number, v: any) => sum + v.traffic_percentage, 0);
      let randomVariant = Math.random() * totalPercentage;
      let selectedVariant = variants[0];

      for (const variant of variants) {
        randomVariant -= variant.traffic_percentage;
        if (randomVariant <= 0) {
          selectedVariant = variant;
          break;
        }
      }

      // Record assignment with transaction to prevent race conditions
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Check if assignment already exists (with lock)
        const existingAssignment = await client.query(
          `SELECT variant_id FROM experiment_assignments 
           WHERE experiment_id = $1 AND visitor_id = $2 AND account_id = $3
           FOR UPDATE`,
          [experimentId, visitor_id, req.accountId]
        );

        if (existingAssignment.rows.length === 0) {
          // Insert new assignment
          await client.query(
            `INSERT INTO experiment_assignments (experiment_id, variant_id, visitor_id, account_id)
             VALUES ($1, $2, $3, $4)`,
            [experimentId, selectedVariant.variant_id, visitor_id, req.accountId]
          );
        } else {
          // Use existing assignment
          const existingVariantId = existingAssignment.rows[0].variant_id;
          const existingVariant = variants.find((v: any) => v.variant_id === existingVariantId);
          if (existingVariant) {
            selectedVariant = existingVariant;
          }
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      activeExperiments.push({
        experiment_id: experimentId,
        experiment_name: experiment.name,
        variant_id: selectedVariant.variant_id,
        variant_name: selectedVariant.variant_name,
        changes: selectedVariant.changes,
        custom_code: selectedVariant.custom_code,
        css_code: selectedVariant.css_code,
        js_code: selectedVariant.js_code,
        is_control: selectedVariant.is_control
      });
    }

    res.json({ experiments: activeExperiments });
  } catch (error) {
    throw error;
  }
});

// Track event (pageview, click, conversion, etc.)
router.post('/events', validate(trackEventSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      visitor_id,
      experiment_id,
      variant_id,
      event_type,
      event_name,
      event_value,
      url,
      metadata
    } = req.body;

    await pool.query(
      `INSERT INTO events 
       (account_id, experiment_id, variant_id, visitor_id, event_type, event_name, event_value, url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        req.accountId,
        experiment_id || null,
        variant_id || null,
        visitor_id,
        event_type,
        event_name || null,
        event_value || null,
        url || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// Get experiment results (for client dashboard)
router.get('/experiments/:id/results', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Verify experiment belongs to account
    const experimentResult = await pool.query(
      'SELECT id, name, primary_goal FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (experimentResult.rows.length === 0) {
      throw new NotFoundError('Experiment');
    }

    // Get variant results
    const resultsQuery = `
      SELECT 
        v.id as variant_id,
        v.name as variant_name,
        v.is_control,
        COUNT(DISTINCT ea.visitor_id) as visitors,
        COUNT(DISTINCT CASE WHEN e.event_type = 'pageview' THEN e.visitor_id END) as pageviews,
        COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN e.visitor_id END) as conversions,
        COUNT(CASE WHEN e.event_type = 'conversion' THEN 1 END) as total_conversions,
        SUM(CASE WHEN e.event_type = 'conversion' THEN e.event_value ELSE 0 END) as revenue
      FROM variants v
      LEFT JOIN experiment_assignments ea ON ea.variant_id = v.id AND ea.experiment_id = $1
      LEFT JOIN events e ON e.variant_id = v.id 
        AND e.experiment_id = $1
        AND e.account_id = $2
        ${start_date ? `AND e.created_at >= $3` : ''}
        ${end_date ? `AND e.created_at <= $4` : ''}
      WHERE v.experiment_id = $1
      GROUP BY v.id, v.name, v.is_control
      ORDER BY v.is_control DESC, v.id
    `;

    const params: any[] = [id, req.accountId];
    if (start_date) params.push(start_date);
    if (end_date) params.push(end_date);

    const results = await pool.query(resultsQuery, params);

    // Calculate conversion rates and statistical significance
    const variants = results.rows.map((row: any) => {
      const conversionRate = row.visitors > 0 ? (row.conversions / row.visitors) * 100 : 0;
      return {
        ...row,
        conversion_rate: parseFloat(conversionRate.toFixed(2))
      };
    });

    res.json({
      experiment: experimentResult.rows[0],
      variants
    });
  } catch (error) {
    throw error;
  }
});

export default router;


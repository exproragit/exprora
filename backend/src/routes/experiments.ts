import express, { Response } from 'express';
import pool from '../database/connection';
import { authenticateClient, AuthRequest } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { createExperimentSchema, updateExperimentSchema, createVariantSchema, updateVariantSchema } from '../validators/schemas';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();

// All routes require client authentication
router.use(authenticateClient);

// Get all experiments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        e.*,
        COUNT(DISTINCT v.id) as variant_count,
        COUNT(DISTINCT ea.visitor_id) as total_visitors,
        COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END) as conversions
      FROM experiments e
      LEFT JOIN variants v ON v.experiment_id = e.id
      LEFT JOIN experiment_assignments ea ON ea.experiment_id = e.id
      LEFT JOIN events ev ON ev.experiment_id = e.id
      WHERE e.account_id = $1
    `;
    const params: any[] = [req.accountId];
    let paramCount = 2;

    if (status) {
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` GROUP BY e.id ORDER BY e.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({ experiments: result.rows });
  } catch (error) {
    throw error;
  }
});

// Get single experiment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const experimentResult = await pool.query(
      'SELECT * FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (experimentResult.rows.length === 0) {
      throw new NotFoundError('Experiment');
    }

    const variantsResult = await pool.query(
      'SELECT * FROM variants WHERE experiment_id = $1 ORDER BY is_control DESC, id',
      [id]
    );

    res.json({
      experiment: experimentResult.rows[0],
      variants: variantsResult.rows
    });
  } catch (error) {
    throw error;
  }
});

// Create experiment
router.post('/', validate(createExperimentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      traffic_allocation,
      primary_goal,
      secondary_goals,
      targeting_rules,
      start_date,
      end_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO experiments 
       (account_id, name, description, type, traffic_allocation, primary_goal, 
        secondary_goals, targeting_rules, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.accountId,
        name,
        description || null,
        type,
        traffic_allocation || 100,
        primary_goal || null,
        secondary_goals ? JSON.stringify(secondary_goals) : null,
        targeting_rules ? JSON.stringify(targeting_rules) : null,
        start_date || null,
        end_date || null,
        req.accountId
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO client_activity_log (account_id, action, resource_type, resource_id, details)
       VALUES ($1, 'create_experiment', 'experiment', $2, $3)`,
      [req.accountId, result.rows[0].id, JSON.stringify({ name, type })]
    );

    const requestId = (req as any).requestId;
    logger.info('Experiment created', { experimentId: result.rows[0].id, accountId: req.accountId, requestId });

    res.status(201).json({ experiment: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

// Update experiment
router.patch('/:id', validate(updateExperimentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const allowedFields = [
      'name', 'description', 'traffic_allocation', 'primary_goal',
      'secondary_goals', 'targeting_rules', 'start_date', 'end_date', 'status'
    ];

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'secondary_goals' || key === 'targeting_rules') {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE experiments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({ experiment: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

// Delete experiment
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM experiments WHERE id = $1 AND account_id = $2 RETURNING id',
      [id, req.accountId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Experiment');
    }

    res.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    throw error;
  }
});

// Create variant
router.post('/:id/variants', validate(createVariantSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, traffic_percentage, changes, custom_code, css_code, js_code, is_control } = req.body;

    // Verify experiment ownership
    const checkResult = await pool.query(
      'SELECT id FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Experiment');
    }

    const result = await pool.query(
      `INSERT INTO variants 
       (experiment_id, name, type, traffic_percentage, changes, custom_code, css_code, js_code, is_control)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        name,
        type || 'variant',
        traffic_percentage || 50,
        changes ? JSON.stringify(changes) : null,
        custom_code || null,
        css_code || null,
        js_code || null,
        is_control || false
      ]
    );

    res.status(201).json({ variant: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

// Update variant
router.patch('/:id/variants/:variantId', validate(updateVariantSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id, variantId } = req.params;
    const updates = req.body;

    // Verify experiment ownership
    const checkResult = await pool.query(
      'SELECT id FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Experiment');
    }

    const allowedFields = ['name', 'traffic_percentage', 'changes', 'custom_code', 'css_code', 'js_code'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'changes') {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(variantId);
    const query = `UPDATE variants SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND experiment_id = $${paramCount + 1} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Variant');
    }

    res.json({ variant: result.rows[0] });
  } catch (error) {
    throw error;
  }
});

// Get experiment results/analytics with statistics
router.get('/:id/results', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Verify ownership
    const experimentResult = await pool.query(
      'SELECT * FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (experimentResult.rows.length === 0) {
      throw new NotFoundError('Experiment');
    }

    // Get variant statistics
    let query = `
      SELECT 
        v.id,
        v.name,
        v.is_control,
        COUNT(DISTINCT ea.visitor_id) as visitors,
        COUNT(DISTINCT CASE WHEN e.event_type = 'pageview' THEN e.visitor_id END) as pageviews,
        COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN e.visitor_id END) as conversions,
        COUNT(CASE WHEN e.event_type = 'conversion' THEN 1 END) as total_conversions,
        SUM(CASE WHEN e.event_type = 'conversion' THEN COALESCE(e.event_value, 0) ELSE 0 END) as revenue
      FROM variants v
      LEFT JOIN experiment_assignments ea ON ea.variant_id = v.id AND ea.experiment_id = $1
      LEFT JOIN events e ON e.variant_id = v.id AND e.experiment_id = $1
    `;

    const params: any[] = [id];
    let paramCount = 2;
    
    if (start_date) {
      query += ` AND e.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      query += ` AND e.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` WHERE v.experiment_id = $1 GROUP BY v.id, v.name, v.is_control ORDER BY v.is_control DESC`;

    const variantsResult = await pool.query(query, params);

    // Import statistics utilities
    const {
      calculateConversionRate,
      calculateStatisticalSignificance,
      calculateLift,
    } = await import('../utils/statistics');

    // Calculate conversion rates and statistics
    const controlVariant = variantsResult.rows.find((v: any) => v.is_control);
    const variants = variantsResult.rows.map((row: any) => {
      const visitors = parseInt(row.visitors) || 0;
      const conversions = parseInt(row.conversions) || 0;
      const conversionRate = calculateConversionRate(conversions, visitors);

      let statistics: any = null;
      if (!row.is_control && controlVariant) {
        const controlVisitors = parseInt(controlVariant.visitors) || 0;
        const controlConversions = parseInt(controlVariant.conversions) || 0;
        const controlRate = calculateConversionRate(controlConversions, controlVisitors);

        const stats = calculateStatisticalSignificance(
          controlConversions,
          controlVisitors,
          conversions,
          visitors
        );

        const lift = calculateLift(controlRate, conversionRate);

        statistics = {
          ...stats,
          lift: lift.liftPercentage,
          controlRate,
        };
      }

      return {
        ...row,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        visitors,
        conversions,
        pageviews: parseInt(row.pageviews) || 0,
        revenue: parseFloat(row.revenue || 0),
        statistics,
      };
    });

    res.json({
      experiment: experimentResult.rows[0],
      variants,
    });
  } catch (error) {
    throw error;
  }
});

export default router;


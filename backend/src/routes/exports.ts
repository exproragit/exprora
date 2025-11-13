import express from 'express';
import pool from '../database/connection';
import { authenticateClient, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Export experiment results as CSV
router.get('/experiments/:id/csv', authenticateClient, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Verify ownership
    const experimentResult = await pool.query(
      'SELECT * FROM experiments WHERE id = $1 AND account_id = $2',
      [id, req.accountId]
    );

    if (experimentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    // Get variant results
    let query = `
      SELECT 
        v.name as variant_name,
        v.is_control,
        COUNT(DISTINCT ea.visitor_id) as visitors,
        COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN e.visitor_id END) as conversions,
        SUM(CASE WHEN e.event_type = 'conversion' THEN COALESCE(e.event_value, 0) ELSE 0 END) as revenue
      FROM variants v
      LEFT JOIN experiment_assignments ea ON ea.variant_id = v.id
      LEFT JOIN events e ON e.variant_id = v.id AND e.experiment_id = $1
    `;

    const params: any[] = [id];
    if (start_date) {
      query += ` AND e.created_at >= $${params.length + 1}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND e.created_at <= $${params.length + 1}`;
      params.push(end_date);
    }

    query += ` WHERE v.experiment_id = $1 GROUP BY v.id, v.name, v.is_control`;

    const result = await pool.query(query, params);

    // Generate CSV
    const csvHeader = 'Variant,Is Control,Visitors,Conversions,Conversion Rate,Revenue\n';
    const csvRows = result.rows.map((row: any) => {
      const conversionRate = row.visitors > 0 
        ? ((row.conversions / row.visitors) * 100).toFixed(2)
        : '0.00';
      return `${row.variant_name},${row.is_control ? 'Yes' : 'No'},${row.visitors},${row.conversions},${conversionRate}%,${row.revenue || 0}`;
    });

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="experiment-${id}-results.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export all experiments as CSV
router.get('/experiments/csv', authenticateClient, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.id,
        e.name,
        e.type,
        e.status,
        COUNT(DISTINCT v.id) as variant_count,
        COUNT(DISTINCT ea.visitor_id) as total_visitors,
        COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END) as conversions,
        e.created_at
       FROM experiments e
       LEFT JOIN variants v ON v.experiment_id = e.id
       LEFT JOIN experiment_assignments ea ON ea.experiment_id = e.id
       LEFT JOIN events ev ON ev.experiment_id = e.id
       WHERE e.account_id = $1
       GROUP BY e.id, e.name, e.type, e.status, e.created_at
       ORDER BY e.created_at DESC`,
      [req.accountId]
    );

    const csvHeader = 'ID,Name,Type,Status,Variants,Visitors,Conversions,Created At\n';
    const csvRows = result.rows.map((row: any) => {
      return `${row.id},"${row.name}",${row.type},${row.status},${row.variant_count},${row.total_visitors},${row.conversions},"${new Date(row.created_at).toISOString()}"`;
    });

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="all-experiments.csv"');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


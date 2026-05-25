import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/summary', async (req, res) => {
  const start = req.query.start;
  const end = req.query.end;
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.sub;

  const params = isAdmin ? [start, end] : [userId, start, end];
  const whereUser = isAdmin ? '' : 'user_id = ? AND ';
  const whereDate = `${whereUser}record_date >= ? AND record_date <= ?`;

  const [summary] = await query(
    `SELECT
       COUNT(*) AS totalBookings,
       COALESCE(SUM(revenue), 0) AS totalRevenue,
       COALESCE(SUM(expenses), 0) AS totalExpenses,
       COALESCE(SUM(nights), 0) AS totalNights,
       COALESCE(AVG(occupancy), 0) AS avgOccupancy
     FROM rental_records WHERE ${whereDate}`,
    params
  );

  const bySource = await query(
    `SELECT source, COUNT(*) AS bookings, SUM(revenue) AS revenue
     FROM rental_records WHERE ${whereDate}
     GROUP BY source ORDER BY revenue DESC`,
    params
  );

  const byProperty = await query(
    `SELECT property_name AS property, COUNT(*) AS bookings, SUM(revenue) AS revenue
     FROM rental_records WHERE ${whereDate}
     GROUP BY property_name ORDER BY revenue DESC LIMIT 10`,
    params
  );

  const monthYear = start?.slice(0, 7);
  const [target] = monthYear
    ? await query(
        `SELECT * FROM financial_targets WHERE user_id = ? AND month_year = ?`,
        [userId, monthYear]
      )
    : [null];

  res.json({
    summary: {
      totalBookings: Number(summary.totalBookings),
      totalRevenue: Number(summary.totalRevenue),
      totalExpenses: Number(summary.totalExpenses),
      totalNights: Number(summary.totalNights),
      avgOccupancy: Math.round(Number(summary.avgOccupancy)),
      netProfit: Number(summary.totalRevenue) - Number(summary.totalExpenses),
    },
    bySource: bySource.map((r) => ({
      source: r.source,
      bookings: Number(r.bookings),
      revenue: Number(r.revenue),
    })),
    byProperty: byProperty.map((r) => ({
      property: r.property,
      bookings: Number(r.bookings),
      revenue: Number(r.revenue),
    })),
    target: target
      ? {
          monthYear: target.month_year,
          revenueTarget: Number(target.revenue_target),
          occupancyTarget: target.occupancy_target,
        }
      : null,
  });
});

router.post('/targets', async (req, res) => {
  const monthYear = req.body?.monthYear;
  const revenueTarget = Number(req.body?.revenueTarget);
  const occupancyTarget = Math.min(100, Math.max(0, Number(req.body?.occupancyTarget) || 80));

  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return res.status(400).json({ error: 'monthYear must be YYYY-MM format.' });
  }

  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();

  await query(
    `INSERT INTO financial_targets (id, user_id, month_year, revenue_target, occupancy_target)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE revenue_target = VALUES(revenue_target), occupancy_target = VALUES(occupancy_target)`,
    [id, req.user.sub, monthYear, revenueTarget, occupancyTarget]
  );

  res.json({ ok: true, monthYear, revenueTarget, occupancyTarget });
});

export default router;

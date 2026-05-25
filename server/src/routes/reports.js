import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { recordActivity } from '../utils/activity.js';
import { getClientIp } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

function parseDateRange(start, end) {
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { error: 'Query params start and end are required (YYYY-MM-DD).' };
  }
  if (start > end) return { error: 'start must be on or before end.' };
  return { start, end };
}

function priorPeriod(start, end) {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const span = e.getTime() - s.getTime();
  const priorEnd = new Date(s.getTime() - 86400000);
  const priorStart = new Date(priorEnd.getTime() - span);
  return {
    priorStart: priorStart.toISOString().slice(0, 10),
    priorEnd: priorEnd.toISOString().slice(0, 10),
  };
}

async function fetchPeriodMetrics(isAdmin, userId, start, end) {
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

  const totalRevenue = Number(summary?.totalRevenue ?? 0);
  const totalExpenses = Number(summary?.totalExpenses ?? 0);
  const totalBookings = Number(summary?.totalBookings ?? 0);
  const totalNights = Number(summary?.totalNights ?? 0);
  const netProfit = totalRevenue - totalExpenses;

  return {
    totalBookings,
    totalRevenue,
    totalExpenses,
    totalNights,
    avgOccupancy: Math.round(Number(summary?.avgOccupancy ?? 0) * 10) / 10,
    netProfit,
    profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0,
    avgRevenuePerBooking: totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0,
    avgRevenuePerNight: totalNights > 0 ? Math.round((totalRevenue / totalNights) * 100) / 100 : 0,
  };
}

router.get('/summary', async (req, res) => {
  const parsed = parseDateRange(req.query.start, req.query.end);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const { start, end } = parsed;
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.sub;
  const params = isAdmin ? [start, end] : [userId, start, end];
  const whereUser = isAdmin ? '' : 'user_id = ? AND ';
  const whereDate = `${whereUser}record_date >= ? AND record_date <= ?`;

  const summary = await fetchPeriodMetrics(isAdmin, userId, start, end);

  const { priorStart, priorEnd } = priorPeriod(start, end);
  const priorSummary = await fetchPeriodMetrics(isAdmin, userId, priorStart, priorEnd);

  const pctChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  };

  const bySource = await query(
    `SELECT source, COUNT(*) AS bookings, SUM(revenue) AS revenue, SUM(expenses) AS expenses
     FROM rental_records WHERE ${whereDate}
     GROUP BY source ORDER BY revenue DESC`,
    params
  );

  const byProperty = await query(
    `SELECT property_name AS property, COUNT(*) AS bookings, SUM(revenue) AS revenue,
            SUM(expenses) AS expenses, AVG(occupancy) AS avgOccupancy
     FROM rental_records WHERE ${whereDate}
     GROUP BY property_name ORDER BY revenue DESC LIMIT 10`,
    params
  );

  const monthly = await query(
    `SELECT DATE_FORMAT(record_date, '%Y-%m') AS month,
            COUNT(*) AS bookings,
            COALESCE(SUM(revenue), 0) AS revenue,
            COALESCE(SUM(expenses), 0) AS expenses,
            COALESCE(AVG(occupancy), 0) AS avgOccupancy
     FROM rental_records WHERE ${whereDate}
     GROUP BY DATE_FORMAT(record_date, '%Y-%m')
     ORDER BY month ASC`,
    params
  );

  const monthYear = start.slice(0, 7);
  const [target] = await query(
    `SELECT * FROM financial_targets WHERE user_id = ? AND month_year = ?`,
    [userId, monthYear]
  );

  const totalSourceRevenue = bySource.reduce((s, r) => s + Number(r.revenue), 0);

  res.json({
    period: { start, end },
    priorPeriod: { start: priorStart, end: priorEnd },
    summary,
    comparison: {
      revenueChange: pctChange(summary.totalRevenue, priorSummary.totalRevenue),
      profitChange: pctChange(summary.netProfit, priorSummary.netProfit),
      bookingsChange: pctChange(summary.totalBookings, priorSummary.totalBookings),
      occupancyChange: pctChange(summary.avgOccupancy, priorSummary.avgOccupancy),
      priorSummary,
    },
    bySource: bySource.map((r) => {
      const revenue = Number(r.revenue);
      return {
        source: r.source,
        bookings: Number(r.bookings),
        revenue,
        expenses: Number(r.expenses),
        share: totalSourceRevenue > 0 ? Math.round((revenue / totalSourceRevenue) * 1000) / 10 : 0,
      };
    }),
    byProperty: byProperty.map((r) => ({
      property: r.property,
      bookings: Number(r.bookings),
      revenue: Number(r.revenue),
      expenses: Number(r.expenses),
      avgOccupancy: Math.round(Number(r.avgOccupancy) * 10) / 10,
    })),
    monthly: monthly.map((r) => {
      const revenue = Number(r.revenue);
      const expenses = Number(r.expenses);
      return {
        month: r.month,
        bookings: Number(r.bookings),
        revenue,
        expenses,
        profit: revenue - expenses,
        avgOccupancy: Math.round(Number(r.avgOccupancy) * 10) / 10,
      };
    }),
    target: target
      ? {
          monthYear: target.month_year,
          revenueTarget: Number(target.revenue_target),
          occupancyTarget: Number(target.occupancy_target),
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
  if (Number.isNaN(revenueTarget) || revenueTarget < 0) {
    return res.status(400).json({ error: 'revenueTarget must be a non-negative number.' });
  }

  await query(
    `INSERT INTO financial_targets (id, user_id, month_year, revenue_target, occupancy_target)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE revenue_target = VALUES(revenue_target), occupancy_target = VALUES(occupancy_target)`,
    [uuidv4(), req.user.sub, monthYear, revenueTarget, occupancyTarget]
  );

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'TARGET_SET',
    details: `Targets for ${monthYear}: revenue ${revenueTarget}, occupancy ${occupancyTarget}%`,
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true, monthYear, revenueTarget, occupancyTarget });
});

export default router;

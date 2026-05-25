import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { authRequired, adminRequired, getClientIp } from '../middleware/auth.js';
import { recordActivity } from '../utils/activity.js';
import { sanitizeInput } from '../utils/sanitize.js';

const router = Router();

function mapLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    details: row.details,
    ipAddress: row.ip_address,
    timestamp: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

router.post('/', authRequired, async (req, res) => {
  const action = sanitizeInput(req.body?.action || '').slice(0, 50);
  const details = sanitizeInput(req.body?.details || '').slice(0, 500);
  if (!action) return res.status(400).json({ error: 'Action is required.' });

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action,
    details,
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

router.get('/', authRequired, adminRequired, async (_req, res) => {
  const rows = await query(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1000'
  );
  res.json({ logs: rows.map(mapLog) });
});

export default router;

import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { mapRecord } from './files.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const start = req.query.start;
  const end = req.query.end;
  const isAdmin = req.user.role === 'admin';

  let rows;
  if (isAdmin) {
    rows = await query(
      `SELECT * FROM rental_records
       WHERE record_date >= ? AND record_date <= ?
       ORDER BY record_date DESC`,
      [start, end]
    );
  } else {
    rows = await query(
      `SELECT * FROM rental_records
       WHERE user_id = ? AND record_date >= ? AND record_date <= ?
       ORDER BY record_date DESC`,
      [req.user.sub, start, end]
    );
  }

  res.json({ records: rows.map(mapRecord) });
});

router.get('/all-records', async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const rows = isAdmin
    ? await query('SELECT * FROM rental_records ORDER BY record_date DESC LIMIT 50000')
    : await query(
        'SELECT * FROM rental_records WHERE user_id = ? ORDER BY record_date DESC LIMIT 50000',
        [req.user.sub]
      );
  res.json({ records: rows.map(mapRecord) });
});

export default router;

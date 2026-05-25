import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { authRequired, getClientIp } from '../middleware/auth.js';
import { recordActivity } from '../utils/activity.js';
import { sanitizeInput } from '../utils/sanitize.js';

const router = Router();

function mapProperty(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    location: row.location,
    defaultSource: row.default_source,
    status: row.status,
    createdAt: row.created_at,
  };
}

router.use(authRequired);

router.get('/', async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const rows = isAdmin
    ? await query('SELECT * FROM properties ORDER BY created_at DESC')
    : await query('SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC', [
        req.user.sub,
      ]);
  res.json({ properties: rows.map(mapProperty) });
});

router.post('/', async (req, res) => {
  const name = sanitizeInput(req.body?.name || '');
  const location = sanitizeInput(req.body?.location || '');
  const defaultSource = sanitizeInput(req.body?.defaultSource || 'Mixed');
  const targetUserId = req.user.role === 'admin' && req.body?.userId ? req.body.userId : req.user.sub;

  if (!name || name.length < 2) return res.status(400).json({ error: 'Property name is required.' });

  const id = uuidv4();
  await query(
    `INSERT INTO properties (id, user_id, name, location, default_source) VALUES (?, ?, ?, ?, ?)`,
    [id, targetUserId, name, location || null, defaultSource || 'Mixed']
  );

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'PROPERTY_CREATE',
    details: `Created property: ${name}`,
    ipAddress: getClientIp(req),
  });

  const rows = await query('SELECT * FROM properties WHERE id = ?', [id]);
  res.status(201).json({ property: mapProperty(rows[0]) });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const isAdmin = req.user.role === 'admin';
  const existing = isAdmin
    ? await query('SELECT * FROM properties WHERE id = ?', [id])
    : await query('SELECT * FROM properties WHERE id = ? AND user_id = ?', [id, req.user.sub]);

  if (!existing.length) return res.status(404).json({ error: 'Property not found.' });

  const name = sanitizeInput(req.body?.name || existing[0].name);
  const location = sanitizeInput(req.body?.location ?? existing[0].location ?? '');
  const defaultSource = sanitizeInput(req.body?.defaultSource || existing[0].default_source);
  const status = req.body?.status === 'inactive' ? 'inactive' : 'active';

  await query(
    'UPDATE properties SET name = ?, location = ?, default_source = ?, status = ? WHERE id = ?',
    [name, location || null, defaultSource, status, id]
  );

  const rows = await query('SELECT * FROM properties WHERE id = ?', [id]);
  res.json({ property: mapProperty(rows[0]) });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const isAdmin = req.user.role === 'admin';
  const existing = isAdmin
    ? await query('SELECT * FROM properties WHERE id = ?', [id])
    : await query('SELECT * FROM properties WHERE id = ? AND user_id = ?', [id, req.user.sub]);

  if (!existing.length) return res.status(404).json({ error: 'Property not found.' });

  await query('DELETE FROM properties WHERE id = ?', [id]);

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'PROPERTY_DELETE',
    details: `Deleted property: ${existing[0].name}`,
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

export default router;

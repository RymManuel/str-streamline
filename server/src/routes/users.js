import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { authRequired, adminRequired, getClientIp } from '../middleware/auth.js';
import { recordActivity } from '../utils/activity.js';
import { sanitizeInput, isValidEmail, isStrongPassword } from '../utils/sanitize.js';

const router = Router();

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

router.use(authRequired, adminRequired);

router.get('/', async (_req, res) => {
  const rows = await query('SELECT * FROM users ORDER BY created_at DESC');
  res.json({ users: rows.map(mapUser) });
});

router.post('/', async (req, res) => {
  const name = sanitizeInput(req.body?.name || '');
  const email = sanitizeInput((req.body?.email || '').toLowerCase());
  const password = req.body?.password || '';
  const role = req.body?.role === 'admin' ? 'admin' : 'user';
  const status = req.body?.status === 'inactive' ? 'inactive' : 'active';

  if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be 8+ chars with upper, lower, and number.' });
  }

  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(400).json({ error: 'A user with this email already exists.' });

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, email, passwordHash, role, status]
  );

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'USER_CREATE',
    details: `Created user: ${email} (${role})`,
    ipAddress: getClientIp(req),
  });

  const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
  res.status(201).json({ user: mapUser(rows[0]) });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const name = sanitizeInput(req.body?.name || '');
  const email = sanitizeInput((req.body?.email || '').toLowerCase());
  const password = req.body?.password || '';
  const role = req.body?.role === 'admin' ? 'admin' : 'user';
  const status = req.body?.status === 'inactive' ? 'inactive' : 'active';

  if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });

  const dup = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
  if (dup.length) return res.status(400).json({ error: 'Email already in use.' });

  if (password) {
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be 8+ chars with upper, lower, and number.' });
    }
    const hash = await bcrypt.hash(password, 12);
    await query(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ?, password_hash = ? WHERE id = ?',
      [name, email, role, status, hash, id]
    );
  } else {
    await query('UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?', [
      name, email, role, status, id,
    ]);
  }

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'USER_UPDATE',
    details: `Updated user: ${email}`,
    ipAddress: getClientIp(req),
  });

  const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: mapUser(rows[0]) });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (id === req.user.sub) return res.status(400).json({ error: 'You cannot delete your own account.' });

  const rows = await query('SELECT email FROM users WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });

  await query('DELETE FROM users WHERE id = ?', [id]);

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'USER_DELETE',
    details: `Deleted user: ${rows[0].email}`,
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

export default router;

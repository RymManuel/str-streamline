import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { signToken, authRequired, getClientIp } from '../middleware/auth.js';
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
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    lastLogin: row.last_login
      ? row.last_login instanceof Date
        ? row.last_login.toISOString()
        : String(row.last_login)
      : undefined,
  };
}

router.get('/setup-status', async (_req, res) => {
  try {
    const rows = await query('SELECT COUNT(*) AS count FROM users');
    res.json({ needsSetup: Number(rows[0].count) === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Database unavailable. Check MySQL connection.' });
  }
});

router.post('/setup-admin', async (req, res) => {
  try {
    const rows = await query('SELECT COUNT(*) AS count FROM users');
    if (Number(rows[0].count) > 0) {
      return res.status(400).json({ error: 'Setup already completed. Use login or create-admin script.' });
    }

    const name = sanitizeInput(req.body?.name || process.env.SETUP_ADMIN_NAME || '');
    const email = sanitizeInput((req.body?.email || process.env.SETUP_ADMIN_EMAIL || '').toLowerCase());
    const password = req.body?.password || process.env.SETUP_ADMIN_PASSWORD || '';

    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be 8+ characters with uppercase, lowercase, and a number.',
      });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'admin', 'active')`,
      [id, name, email, passwordHash]
    );

    const ip = getClientIp(req);
    await recordActivity({
      userId: id,
      userName: name,
      action: 'SETUP_ADMIN',
      details: 'Initial administrator account created',
      ipAddress: ip,
    });

    const token = signToken({ id, email, role: 'admin', name });
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    res.status(201).json({
      token,
      expiresAt,
      user: { id, name, email, role: 'admin' },
    });
  } catch (err) {
    console.error('setup-admin', err);
    res.status(500).json({ error: 'Failed to create administrator.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = sanitizeInput((req.body?.email || '').toLowerCase());
    const password = req.body?.password || '';

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email or password.' });

    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const ip = getClientIp(req);
    await recordActivity({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      details: 'User logged in successfully',
      ipAddress: ip,
    });

    const token = signToken(user);
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    res.json({
      token,
      expiresAt,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('login', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/logout', authRequired, async (req, res) => {
  try {
    await recordActivity({
      userId: req.user.sub,
      userName: req.user.name,
      action: 'LOGOUT',
      details: 'User logged out',
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.sub]);
    const user = rows[0];
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }
    res.json({ user: mapUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

router.put('/profile', authRequired, async (req, res) => {
  try {
    const name = sanitizeInput(req.body?.name || '');
    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });

    await query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.sub]);
    await recordActivity({
      userId: req.user.sub,
      userName: name,
      action: 'PROFILE_UPDATE',
      details: 'Updated profile name',
      ipAddress: getClientIp(req),
    });

    const rows = await query('SELECT * FROM users WHERE id = ?', [req.user.sub]);
    res.json({ user: mapUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

router.put('/password', authRequired, async (req, res) => {
  try {
    const currentPassword = req.body?.currentPassword || '';
    const newPassword = req.body?.newPassword || '';

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'New password must be 8+ characters with uppercase, lowercase, and a number.',
      });
    }

    const rows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.sub]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.sub]);

    await recordActivity({
      userId: req.user.sub,
      userName: req.user.name,
      action: 'PASSWORD_CHANGE',
      details: 'Password updated',
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;

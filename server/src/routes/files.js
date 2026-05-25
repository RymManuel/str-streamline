import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { authRequired, getClientIp } from '../middleware/auth.js';
import { recordActivity } from '../utils/activity.js';

const router = Router();

function mapFile(row) {
  const uploaded = row.uploaded_at;
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    rowCount: row.row_count,
    uploadedAt: uploaded instanceof Date ? uploaded.toISOString() : String(uploaded),
    source: row.source,
  };
}

function mapRecord(row) {
  return {
    id: row.id,
    fileId: row.file_id,
    userId: row.user_id,
    date: row.record_date instanceof Date
      ? row.record_date.toISOString().split('T')[0]
      : String(row.record_date).split('T')[0],
    property: row.property_name,
    guest: row.guest,
    nights: row.nights,
    revenue: Number(row.revenue),
    expenses: Number(row.expenses),
    occupancy: row.occupancy,
    source: row.source,
    status: row.status,
  };
}

router.use(authRequired);

router.get('/', async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const rows = isAdmin
    ? await query('SELECT * FROM uploaded_files ORDER BY uploaded_at DESC')
    : await query('SELECT * FROM uploaded_files WHERE user_id = ? ORDER BY uploaded_at DESC', [
        req.user.sub,
      ]);
  res.json({ files: rows.map(mapFile) });
});

router.post('/upload', async (req, res) => {
  const { fileName, source, records } = req.body || {};
  if (!fileName || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'fileName and records are required.' });
  }
  if (records.length > 50000) {
    return res.status(400).json({ error: 'Maximum 50,000 records per upload.' });
  }

  const fileId = uuidv4();
  const userId = req.user.sub;

  await query(
    `INSERT INTO uploaded_files (id, user_id, file_name, row_count, source) VALUES (?, ?, ?, ?, ?)`,
    [fileId, userId, String(fileName).slice(0, 255), records.length, source || 'Unknown']
  );

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    await query(
      `INSERT INTO rental_records
       (id, file_id, user_id, record_date, property_name, guest, nights, revenue, expenses, occupancy, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        fileId,
        userId,
        r.date,
        String(r.property || 'Unknown').slice(0, 150),
        r.guest ? String(r.guest).slice(0, 150) : null,
        Math.max(0, Number(r.nights) || 0),
        Math.max(0, Number(r.revenue) || 0),
        Math.max(0, Number(r.expenses) || 0),
        Math.min(100, Math.max(0, Number(r.occupancy) || 0)),
        String(r.source || source || 'Unknown').slice(0, 50),
        ['completed', 'cancelled', 'pending'].includes(r.status) ? r.status : 'completed',
      ]
    );
  }

  await recordActivity({
    userId,
    userName: req.user.name,
    action: 'CSV_UPLOAD',
    details: `Uploaded ${fileName} with ${records.length} records`,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ fileId, rowCount: records.length });
});

router.delete('/:id', async (req, res) => {
  const fileId = req.params.id;
  const isAdmin = req.user.role === 'admin';

  const files = isAdmin
    ? await query('SELECT * FROM uploaded_files WHERE id = ?', [fileId])
    : await query('SELECT * FROM uploaded_files WHERE id = ? AND user_id = ?', [fileId, req.user.sub]);

  if (!files.length) return res.status(404).json({ error: 'File not found.' });

  await query('DELETE FROM uploaded_files WHERE id = ?', [fileId]);

  await recordActivity({
    userId: req.user.sub,
    userName: req.user.name,
    action: 'FILE_DELETE',
    details: `Deleted file: ${files[0].file_name}`,
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

export { mapRecord };

export default router;

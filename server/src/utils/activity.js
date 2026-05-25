import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';

export async function recordActivity({ userId, userName, action, details, ipAddress }) {
  await query(
    `INSERT INTO activity_logs (id, user_id, user_name, action, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), userId, userName, action, details || null, ipAddress]
  );
}

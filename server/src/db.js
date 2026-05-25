import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'str_streamline',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: false,
});

// Keep TIMESTAMP reads/writes aligned with UTC (works with mysql2/promise wrapper)
const rawPool = pool.pool ?? pool;
if (typeof rawPool?.on === 'function') {
  rawPool.on('connection', (connection) => {
    connection.query("SET time_zone = '+00:00'", (err) => {
      if (err) console.error('[db] Failed to set session time_zone:', err.message);
    });
  });
}

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function healthCheck() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export default pool;

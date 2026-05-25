import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { healthCheck } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import filesRoutes from './routes/files.js';
import analyticsRoutes from './routes/analytics.js';
import logsRoutes from './routes/logs.js';
import propertiesRoutes from './routes/properties.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Try again later.' },
});

app.get('/api/health', async (_req, res) => {
  const dbOk = await healthCheck();
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`STR-Streamline API running on http://localhost:${PORT}`);
});

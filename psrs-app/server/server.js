import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { db } from './db/database.js';

import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(config.uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const userCount = db.get('SELECT COUNT(id) as count FROM users');
    return res.json({
      status: 'operational',
      system: 'PSRS Local Service Requests Demo',
      version: '1.0.0',
      database: 'connected (node:sqlite)',
      registered_users: userCount ? userCount.count : 0,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ status: 'degraded', error: err.message });
  }
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Image upload error: ${err.message}` });
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

app.listen(config.port, () => {
  console.log(`[PSRS Backend] Server running on http://localhost:${config.port}`);
  console.log(`[PSRS Backend] Environment: ${config.nodeEnv}`);
});

export default app;

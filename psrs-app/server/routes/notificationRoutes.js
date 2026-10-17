import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getPublicAnnouncements,
  createAnnouncement,
  getAuditLogs
} from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Notifications
router.get('/', authenticateToken, getUserNotifications);
router.patch('/:id/read', authenticateToken, markNotificationAsRead);
router.patch('/read-all', authenticateToken, markAllNotificationsAsRead);

// Announcements
router.get('/announcements', getPublicAnnouncements);
router.post('/announcements', authenticateToken, requireRole('admin'), createAnnouncement);

// Audit logs
router.get('/audit-logs', authenticateToken, requireRole('admin'), getAuditLogs);

export default router;

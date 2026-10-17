import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Notifications
router.get('/', authenticateToken, getUserNotifications);
router.patch('/:id/read', authenticateToken, markNotificationAsRead);
router.patch('/read-all', authenticateToken, markAllNotificationsAsRead);

export default router;

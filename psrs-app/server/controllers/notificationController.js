import { db } from '../db/database.js';

export const getUserNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = db.query(
      `SELECT * FROM notifications
       WHERE user_id = ? AND link LIKE '/citizen/requests/%'
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const unreadCount = db.get(
      `SELECT COUNT(id) as count FROM notifications
       WHERE user_id = ? AND is_read = 0 AND link LIKE '/citizen/requests/%'`,
      [userId]
    );

    return res.json({
      success: true,
      unread_count: unreadCount ? unreadCount.count : 0,
      notifications
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

export const markNotificationAsRead = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.run(
      `UPDATE notifications SET is_read = 1
       WHERE id = ? AND user_id = ? AND link LIKE '/citizen/requests/%'`,
      [id, userId]
    );

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

export const markAllNotificationsAsRead = (req, res) => {
  try {
    const userId = req.user.id;
    db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND link LIKE '/citizen/requests/%'`, [userId]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};

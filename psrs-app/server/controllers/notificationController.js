import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { logAudit } from '../utils/auditLogger.js';

export const getUserNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    const unreadCount = db.get(
      'SELECT COUNT(id) as count FROM notifications WHERE user_id = ? AND is_read = 0',
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

    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

export const markAllNotificationsAsRead = (req, res) => {
  try {
    const userId = req.user.id;
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};

export const getPublicAnnouncements = (req, res) => {
  try {
    const announcements = db.query(
      'SELECT id, title, summary, content, priority, created_at FROM announcements WHERE is_published = 1 ORDER BY created_at DESC LIMIT 10'
    );
    return res.json({ success: true, announcements });
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve announcements.' });
  }
};

export const createAnnouncement = (req, res) => {
  try {
    const { title, summary, content, priority = 'normal' } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO announcements (id, title, summary, content, priority, is_published, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, title.trim(), summary ? summary.trim() : title.trim(), content.trim(), priority, req.user.id, now]
    );

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'ANNOUNCEMENT_PUBLISHED',
      entityType: 'announcement',
      entityId: id,
      details: { title, priority },
      req
    });

    return res.status(201).json({ success: true, message: 'Official announcement published.', announcementId: id });
  } catch (err) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
};

export const getAuditLogs = (req, res) => {
  try {
    const { action, entity_type, search, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (action && action !== 'All') {
      where += ' AND l.action = ?';
      params.push(action);
    }

    if (entity_type && entity_type !== 'All') {
      where += ' AND l.entity_type = ?';
      params.push(entity_type);
    }

    if (search) {
      where += ' AND (l.user_email LIKE ? OR l.action LIKE ? OR l.details LIKE ? OR l.entity_id LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const countRow = db.get(`SELECT COUNT(l.id) as total FROM audit_logs l ${where}`, params);
    const logs = db.query(
      `SELECT l.*, u.full_name as user_name, u.role as user_role
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.timestamp DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map(l => ({
      ...l,
      details: typeof l.details === 'string' ? JSON.parse(l.details || '{}') : l.details
    }));

    return res.json({
      success: true,
      total: countRow ? countRow.total : 0,
      page: pageNum,
      totalPages: Math.ceil((countRow?.total || 0) / pageSize),
      logs
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit trail.' });
  }
};

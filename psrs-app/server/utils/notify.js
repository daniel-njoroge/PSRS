import crypto from 'node:crypto';
import { db } from '../db/database.js';

export function createNotification({
  userId,
  title,
  message,
  link = null,
  type = 'status_update'
}) {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, userId, title, message, link, type, createdAt]
    );
    return id;
  } catch (err) {
    console.error('Notification Error:', err);
    return null;
  }
}

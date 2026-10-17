import crypto from 'node:crypto';
import { db } from '../db/database.js';

export function logAudit({
  userId = null,
  userEmail = null,
  action,
  entityType,
  entityId = null,
  details = {},
  req = null
}) {
  try {
    const id = crypto.randomUUID();
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      if (!userId && req.user) {
        userId = req.user.id;
        userEmail = req.user.email;
      }
    }

    const timestamp = new Date().toISOString();
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);

    db.run(
      `INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, userEmail, action, entityType, entityId, detailsJson, String(ipAddress), timestamp]
    );
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}

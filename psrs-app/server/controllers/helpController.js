import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { logAudit } from '../utils/auditLogger.js';

export const getFaqs = (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM faqs';
    const params = [];
    if (category && category !== 'All') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY display_order ASC, id ASC';

    const faqs = db.query(query, params);
    return res.json({ success: true, count: faqs.length, faqs });
  } catch (err) {
    console.error('Get FAQs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve FAQs.' });
  }
};

export const submitSupportTicket = (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject, and inquiry message are required.' });
    }

    const ticketId = crypto.randomUUID();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();
    const userId = req.user ? req.user.id : null;

    db.run(
      `INSERT INTO support_tickets (id, ticket_number, user_id, name, email, phone, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)`,
      [ticketId, ticketNumber, userId, name.trim(), email.trim(), phone ? phone.trim() : null, subject.trim(), message.trim(), now]
    );

    logAudit({
      userId,
      userEmail: email.trim(),
      action: 'SUPPORT_TICKET_SUBMITTED',
      entityType: 'ticket',
      entityId: ticketId,
      details: { ticketNumber, subject },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Support request lodged successfully. A public service helpdesk officer will respond via email/SMS.',
      ticketNumber
    });
  } catch (err) {
    console.error('Submit ticket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to lodge support ticket.' });
  }
};

export const getSupportTickets = (req, res) => {
  try {
    const tickets = db.query('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 50');
    return res.json({ success: true, tickets });
  } catch (err) {
    console.error('Get tickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve support tickets.' });
  }
};

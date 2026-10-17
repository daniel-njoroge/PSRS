import crypto from 'node:crypto';
import path from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';
import { db } from '../db/database.js';
import { config } from '../config/index.js';
import { createNotification } from '../utils/notify.js';
import { logAudit } from '../utils/auditLogger.js';

export const REQUEST_CATEGORIES = [
  'Roads & Lighting',
  'Water Services',
  'Waste Management',
  'Drainage & Flooding',
  'Public Spaces & Parks',
  'Public Facilities'
];

export const REQUEST_STATUSES = ['Pending', 'In Progress', 'Resolved'];
const DEMO_REQUEST_REFERENCES = [
  'PSR-2026-DEMO001',
  'PSR-2026-DEMO002',
  'PSR-2026-DEMO003'
];

function createReferenceNumber() {
  const year = new Date().getFullYear();
  return `PSR-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const requestSelect = `
  SELECT r.id, r.reference_number, r.citizen_id, r.category, r.location,
         r.description, r.image_path, r.status, r.created_at, r.updated_at,
         u.full_name AS citizen_name
  FROM service_requests r
  JOIN users u ON u.id = r.citizen_id
`;

export const createRequest = async (req, res) => {
  try {
    const { category, location, description } = req.body;
    if (!REQUEST_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Choose a valid request category.' });
    }
    if (typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Location is required.' });
    }
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }
    if (location.trim().length > 300 || description.trim().length > 3000) {
      return res.status(400).json({ success: false, message: 'Location or description exceeds the allowed length.' });
    }

    const id = crypto.randomUUID();
    const referenceNumber = createReferenceNumber();
    const now = new Date().toISOString();
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
    const imageFilename = req.file ? `request-${crypto.randomUUID()}${extensions[req.file.mimetype]}` : null;
    const imagePath = imageFilename ? `/uploads/${imageFilename}` : null;

    if (req.file && imageFilename) {
      await writeFile(path.join(config.uploadsDir, imageFilename), req.file.buffer, { flag: 'wx' });
    }
    try {
      db.transaction(() => {
        db.run(
          `INSERT INTO service_requests
            (id, reference_number, citizen_id, category, location, description, image_path, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
          [id, referenceNumber, req.user.id, category, location.trim(), description.trim(), imagePath, now, now]
        );
        db.run(
          `INSERT INTO request_status_history
            (id, request_id, previous_status, new_status, changed_by_user_id, note, created_at)
           VALUES (?, ?, NULL, 'Pending', ?, 'Request submitted', ?)`,
          [crypto.randomUUID(), id, req.user.id, now]
        );
      });
    } catch (err) {
      if (imageFilename) {
        try {
          await unlink(path.join(config.uploadsDir, imageFilename));
        } catch (cleanupError) {
          console.error('Failed to remove an unlinked request image:', cleanupError);
        }
      }
      throw err;
    }

    createNotification({
      userId: req.user.id,
      title: 'Request received',
      message: `Your ${category.toLowerCase()} request is now pending.`,
      link: `/citizen/requests/${id}`
    });
    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'REQUEST_CREATED',
      entityType: 'service_request',
      entityId: id,
      details: { referenceNumber, category },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Your request has been submitted.',
      request: db.get(`${requestSelect} WHERE r.id = ?`, [id])
    });
  } catch (err) {
    console.error('Create request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit request.' });
  }
};

export const getMyRequests = (req, res) => {
  try {
    const requests = db.query(
      `${requestSelect} WHERE r.citizen_id = ? ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('Get citizen requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load your requests.' });
  }
};

export const getAllRequests = (req, res) => {
  try {
    const { status, category, search } = req.query;
    let where = 'WHERE 1 = 1';
    const params = [];
    if (status && status !== 'All' && REQUEST_STATUSES.includes(status)) {
      where += ' AND r.status = ?';
      params.push(status);
    }
    if (category && category !== 'All' && REQUEST_CATEGORIES.includes(category)) {
      where += ' AND r.category = ?';
      params.push(category);
    }
    if (search) {
      where += ' AND (r.reference_number LIKE ? OR r.location LIKE ? OR r.description LIKE ? OR u.full_name LIKE ?)';
      const query = `%${String(search).trim()}%`;
      params.push(query, query, query, query);
    }
    const requests = db.query(`${requestSelect} ${where} ORDER BY r.created_at DESC`, params);
    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Get all requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load requests.' });
  }
};

export const getRequestById = (req, res) => {
  try {
    const request = db.get(`${requestSelect} WHERE r.id = ?`, [req.params.id]);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (req.user.role !== 'admin' && request.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot view this request.' });
    }
    const history = db.query(
      `SELECT h.new_status AS status, h.note, h.created_at, u.full_name AS updated_by
       FROM request_status_history h
       LEFT JOIN users u ON u.id = h.changed_by_user_id
       WHERE h.request_id = ? ORDER BY h.created_at ASC`,
      [request.id]
    );
    return res.json({ success: true, request: { ...request, history } });
  } catch (err) {
    console.error('Get request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load request.' });
  }
};

export const updateRequestStatus = (req, res) => {
  try {
    const { status, note } = req.body;
    if (!REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Choose Pending, In Progress, or Resolved.' });
    }
    if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > 1000)) {
      return res.status(400).json({ success: false, message: 'Status notes must be 1,000 characters or fewer.' });
    }
    const request = db.get(
      `SELECT r.*, u.email AS citizen_email FROM service_requests r
       JOIN users u ON u.id = r.citizen_id WHERE r.id = ?`,
      [req.params.id]
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status === 'Resolved' || REQUEST_STATUSES.indexOf(status) !== REQUEST_STATUSES.indexOf(request.status) + 1) {
      return res.status(400).json({ success: false, message: 'Requests can only move from Pending to In Progress to Resolved.' });
    }

    const now = new Date(Math.max(Date.now(), Date.parse(request.updated_at) + 1)).toISOString();
    db.transaction(() => {
      db.run('UPDATE service_requests SET status = ?, updated_at = ? WHERE id = ?', [status, now, request.id]);
      db.run(
        `INSERT INTO request_status_history
          (id, request_id, previous_status, new_status, changed_by_user_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), request.id, request.status, status, req.user.id, note?.trim() || null, now]
      );
    });
    createNotification({
      userId: request.citizen_id,
      title: `Request ${status.toLowerCase()}`,
      message: `Your request ${request.reference_number} is now ${status.toLowerCase()}.`,
      link: `/citizen/requests/${request.id}`
    });
    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'REQUEST_STATUS_UPDATED',
      entityType: 'service_request',
      entityId: request.id,
      details: { referenceNumber: request.reference_number, previousStatus: request.status, status },
      req
    });
    return res.json({ success: true, status, message: 'Request status updated.' });
  } catch (err) {
    console.error('Update request status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update request status.' });
  }
};

export const trackRequest = (req, res) => {
  try {
    const request = db.get(
      `SELECT reference_number, category, status, created_at, updated_at
       FROM service_requests WHERE reference_number = ?`,
      [req.params.referenceNumber.toUpperCase()]
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'No request was found with that reference number.' });
    }
    const history = db.query(
      `SELECT new_status AS status, created_at
       FROM request_status_history WHERE request_id = (
         SELECT id FROM service_requests WHERE reference_number = ?
       ) ORDER BY created_at ASC`,
      [request.reference_number]
    );
    return res.json({ success: true, request: { ...request, history } });
  } catch (err) {
    console.error('Track request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to track request.' });
  }
};

export const getDemoRequests = (_req, res) => {
  try {
    const placeholders = DEMO_REQUEST_REFERENCES.map(() => '?').join(', ');
    const requests = db.query(
      `SELECT reference_number, category, status, created_at, updated_at
       FROM service_requests
       WHERE reference_number IN (${placeholders})
       ORDER BY reference_number`,
      DEMO_REQUEST_REFERENCES
    );
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('Get demo requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load demo requests.' });
  }
};

export const getRequestStats = (_req, res) => {
  try {
    const totals = db.get(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
       FROM service_requests`
    );
    const categoryCounts = db.query(
      `SELECT category, COUNT(*) AS count FROM service_requests GROUP BY category ORDER BY count DESC`
    );
    return res.json({
      success: true,
      stats: { total: totals.total, open: totals.open || 0, resolved: totals.resolved || 0, byCategory: categoryCounts }
    });
  } catch (err) {
    console.error('Get request stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load request analytics.' });
  }
};

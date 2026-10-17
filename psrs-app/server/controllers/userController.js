import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAllUsers = (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (role && role !== 'All') {
      where += ' AND role = ?';
      params.push(role);
    }

    if (status && status !== 'All') {
      where += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      where += ' AND (full_name LIKE ? OR email LIKE ? OR national_id LIKE ? OR phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const countRow = db.get(`SELECT COUNT(id) as total FROM users ${where}`, params);
    const users = db.query(
      `SELECT id, full_name, national_id, email, phone, role, department, county, sub_county, status, created_at, updated_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return res.json({
      success: true,
      total: countRow ? countRow.total : 0,
      page: pageNum,
      totalPages: Math.ceil((countRow?.total || 0) / pageSize),
      users
    });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user accounts.' });
  }
};

export const updateUserRole = (req, res) => {
  try {
    const { id } = req.params;
    const { role, department } = req.body;

    if (!['citizen', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const targetUser = db.get('SELECT id, full_name, email, role, department FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Prevent removing the last admin
    if (targetUser.role === 'admin' && role !== 'admin') {
      const adminCount = db.get('SELECT COUNT(id) as count FROM users WHERE role = \'admin\' AND status = \'active\'');
      if (adminCount.count <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the sole active system administrator.' });
      }
    }

    const now = new Date().toISOString();
    db.run(
      'UPDATE users SET role = ?, department = ?, updated_at = ? WHERE id = ?',
      [role, department || null, now, id]
    );

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'USER_ROLE_CHANGED',
      entityType: 'user',
      entityId: id,
      details: {
        targetEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole: role,
        department: department || null
      },
      req
    });

    return res.json({
      success: true,
      message: `User ${targetUser.full_name} assigned role "${role}".`
    });
  } catch (err) {
    console.error('Update user role error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
};

export const toggleUserStatus = (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own administrative session.' });
    }

    const targetUser = db.get('SELECT id, full_name, email, status FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const now = new Date().toISOString();

    db.run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      entityType: 'user',
      entityId: id,
      details: { targetEmail: targetUser.email, status: newStatus },
      req
    });

    return res.json({
      success: true,
      message: `Account for ${targetUser.full_name} is now ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    console.error('Toggle user status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
};

export const createStaffUser = async (req, res) => {
  try {
    const { full_name, national_id, email, phone, role, department, county, sub_county, password } = req.body;

    if (!full_name || !national_id || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'Mandatory staff creation fields are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = db.get('SELECT id FROM users WHERE email = ? OR national_id = ?', [trimmedEmail, national_id.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or National ID already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, full_name, national_id, email, phone, password_hash, role, department, county, sub_county, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [userId, full_name.trim(), national_id.trim(), trimmedEmail, phone.trim(), passwordHash, role, department || null, county || 'Nairobi', sub_county || 'Central', now, now]
    );

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'STAFF_ACCOUNT_CREATED',
      entityType: 'user',
      entityId: userId,
      details: { email: trimmedEmail, role, department },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Staff account created for ${full_name}.`,
      userId
    });
  } catch (err) {
    console.error('Create staff error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create staff account.' });
  }
};

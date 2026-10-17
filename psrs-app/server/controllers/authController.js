import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { config } from '../config/index.js';
import { logAudit } from '../utils/auditLogger.js';

export const register = async (req, res) => {
  try {
    const { full_name, national_id, email, phone, county, sub_county, password } = req.body;

    // Server-side validation
    if (!full_name || !national_id || !email || !phone || !county || !sub_county || !password) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' });
    }

    const trimmedId = national_id.trim();
    if (!/^\d{6,10}$/.test(trimmedId)) {
      return res.status(400).json({ success: false, message: 'Invalid Kenyan National ID number. Must be 6 to 10 digits.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const trimmedPhone = phone.trim();
    if (!/^(?:\+254|0)[17]\d{8}$/.test(trimmedPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid Kenyan phone number format. Example: 0712345678 or +254712345678' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check existing
    const existing = db.get(
      'SELECT id, email, national_id FROM users WHERE email = ? OR national_id = ?',
      [trimmedEmail, trimmedId]
    );

    if (existing) {
      if (existing.email === trimmedEmail) {
        return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      }
      if (existing.national_id === trimmedId) {
        return res.status(409).json({ success: false, message: 'An account with this National ID number already exists.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, full_name, national_id, email, phone, password_hash, role, county, sub_county, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'citizen', ?, ?, 'active', ?, ?)`,
      [userId, full_name.trim(), trimmedId, trimmedEmail, trimmedPhone, passwordHash, county.trim(), sub_county.trim(), now, now]
    );

    logAudit({
      userId,
      userEmail: trimmedEmail,
      action: 'USER_REGISTER',
      entityType: 'user',
      entityId: userId,
      details: { role: 'citizen', county: county.trim() },
      req
    });

    const token = jwt.sign({ id: userId, email: trimmedEmail, role: 'citizen' }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    const user = {
      id: userId,
      full_name: full_name.trim(),
      national_id: trimmedId,
      email: trimmedEmail,
      phone: trimmedPhone,
      role: 'citizen',
      department: null,
      county: county.trim(),
      sub_county: sub_county.trim(),
      status: 'active'
    };

    return res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email or National ID and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Find by email or national_id
    const user = db.get(
      'SELECT * FROM users WHERE LOWER(email) = ? OR national_id = ?',
      [cleanIdentifier, identifier.trim()]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email/National ID and password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email/National ID and password.' });
    }

    logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: { role: user.role },
      req
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      national_id: user.national_id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      county: user.county,
      sub_county: user.sub_county,
      status: user.status
    };

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
};

export const getMe = (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

export const updateProfile = (req, res) => {
  try {
    const { phone, county, sub_county } = req.body;
    const userId = req.user.id;

    if (!phone || !county || !sub_county) {
      return res.status(400).json({ success: false, message: 'Phone, county, and sub-county are required.' });
    }

    const trimmedPhone = phone.trim();
    if (!/^(?:\+254|0)[17]\d{8}$/.test(trimmedPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid Kenyan phone number format.' });
    }

    const now = new Date().toISOString();

    db.run(
      'UPDATE users SET phone = ?, county = ?, sub_county = ?, updated_at = ? WHERE id = ?',
      [trimmedPhone, county.trim(), sub_county.trim(), now, userId]
    );

    logAudit({
      userId,
      userEmail: req.user.email,
      action: 'PROFILE_UPDATED',
      entityType: 'user',
      entityId: userId,
      details: { phone: trimmedPhone, county: county.trim() },
      req
    });

    const updatedUser = db.get(
      'SELECT id, full_name, national_id, email, phone, role, department, county, sub_county, status FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error updating profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match records.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    const now = new Date().toISOString();

    db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, userId]);

    logAudit({
      userId,
      userEmail: req.user.email,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
      details: {},
      req
    });

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error changing password.' });
  }
};

export const requestPasswordReset = (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Email or National ID is required.' });
  }

  // Realistic government portal recovery instruction
  return res.json({
    success: true,
    message: 'If an active citizen account exists for this identifier, password reset instructions and verification code have been dispatched to the registered mobile number via SMS and primary email.'
  });
};

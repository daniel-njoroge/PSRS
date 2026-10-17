import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { config } from '../config/index.js';
import { logAudit } from '../utils/auditLogger.js';

const legacyUserColumns = new Set(db.query('PRAGMA table_info(users)').map((column) => column.name));

export const register = async (req, res) => {
  try {
    const { full_name, email, phone = '', password } = req.body;
    if (typeof full_name !== 'string' || !full_name.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    if (cleanName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid name and email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (cleanPhone && !/^(?:\+254|0)[17]\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid Kenyan phone number or leave it blank.' });
    }
    if (db.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail])) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    if (legacyUserColumns.has('national_id')) {
      db.run(
        `INSERT INTO users
          (id, full_name, national_id, email, phone, password_hash, role, county, sub_county, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'citizen', 'Nairobi', 'Nairobi', 'active', ?, ?)`,
        [id, cleanName, `PSRS-${id}`, cleanEmail, cleanPhone, passwordHash, now, now]
      );
    } else {
      db.run(
        `INSERT INTO users (id, full_name, email, phone, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'citizen', 'active', ?, ?)`,
        [id, cleanName, cleanEmail, cleanPhone || null, passwordHash, now, now]
      );
    }
    logAudit({ userId: id, userEmail: cleanEmail, action: 'CITIZEN_REGISTERED', entityType: 'user', entityId: id, req });
    const token = jwt.sign({ id, email: cleanEmail, role: 'citizen' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return res.status(201).json({
      success: true,
      message: 'Citizen account created.',
      token,
      user: { id, full_name: cleanName, email: cleanEmail, phone: cleanPhone || null, role: 'citizen', status: 'active' }
    });
  } catch (err) {
    console.error('Citizen registration error:', err);
    return res.status(500).json({ success: false, message: 'Could not create the citizen account.' });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const cleanEmail = String(email || identifier || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = db.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (!user || !['citizen', 'admin'].includes(user.role)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account is suspended.' });
    }
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      status: user.status
    };
    logAudit({ userId: user.id, userEmail: user.email, action: 'USER_LOGIN', entityType: 'user', entityId: user.id, req });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return res.json({ success: true, message: 'Signed in.', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Could not sign in.' });
  }
};

export const getMe = (req, res) => res.json({ success: true, user: req.user });

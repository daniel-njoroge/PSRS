import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../db/database.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }

    const user = db.get('SELECT id, full_name, email, phone, role, status FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact the administrator.' });
    }
    if (!['citizen', 'admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'This account role is not supported.' });
    }

    req.user = user;
    next();
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of [${roles.join(', ')}] role.`
      });
    }

    next();
  };
}

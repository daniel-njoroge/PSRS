import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  createStaffUser
} from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), getAllUsers);
router.post('/staff', authenticateToken, requireRole('admin'), createStaffUser);
router.patch('/:id/role', authenticateToken, requireRole('admin'), updateUserRole);
router.patch('/:id/toggle-status', authenticateToken, requireRole('admin'), toggleUserStatus);

export default router;

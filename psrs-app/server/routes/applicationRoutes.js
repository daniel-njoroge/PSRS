import express from 'express';
import {
  submitApplication,
  getMyApplications,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  assignStaff,
  resolveCitizenAction,
  trackByReference
} from '../controllers/applicationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public request tracking
router.get('/track/:ref', trackByReference);

// Citizen application routes
router.get('/my', authenticateToken, getMyApplications);
router.post('/', authenticateToken, upload.any(), submitApplication);
router.post('/:id/resolve-action', authenticateToken, upload.any(), resolveCitizenAction);

// Shared detail route (citizen can see own; staff/admin can see any)
router.get('/:id', authenticateToken, getApplicationById);

// Staff and Admin application management
router.get('/', authenticateToken, requireRole('staff', 'admin'), getAllApplications);
router.patch('/:id/status', authenticateToken, requireRole('staff', 'admin'), updateApplicationStatus);
router.patch('/:id/assign', authenticateToken, requireRole('staff', 'admin'), assignStaff);

export default router;

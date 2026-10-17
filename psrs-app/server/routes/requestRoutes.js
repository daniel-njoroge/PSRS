import express from 'express';
import {
  createRequest,
  getDemoRequests,
  getAllRequests,
  getMyRequests,
  getRequestById,
  getRequestStats,
  trackRequest,
  updateRequestStatus
} from '../controllers/requestController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';

const router = express.Router();

router.get('/demo', getDemoRequests);
router.get('/track/:referenceNumber', trackRequest);
router.get('/my', authenticateToken, requireRole('citizen'), getMyRequests);
router.post('/', authenticateToken, requireRole('citizen'), imageUpload.single('image'), createRequest);
router.get('/stats', authenticateToken, requireRole('admin'), getRequestStats);
router.get('/', authenticateToken, requireRole('admin'), getAllRequests);
router.patch('/:id/status', authenticateToken, requireRole('admin'), updateRequestStatus);
router.get('/:id', authenticateToken, getRequestById);

export default router;

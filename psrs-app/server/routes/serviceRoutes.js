import express from 'express';
import {
  getAllServices,
  getServiceByIdOrSlug,
  getCategories,
  createService,
  updateService,
  toggleServiceStatus
} from '../controllers/serviceController.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getAllServices);
router.get('/categories', getCategories);
router.get('/:idOrSlug', getServiceByIdOrSlug);

// Administrative operations
router.post('/', authenticateToken, requireRole('admin'), createService);
router.put('/:id', authenticateToken, requireRole('admin'), updateService);
router.patch('/:id/toggle-status', authenticateToken, requireRole('admin'), toggleServiceStatus);

export default router;

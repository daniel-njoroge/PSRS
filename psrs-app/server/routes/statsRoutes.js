import express from 'express';
import { getAdminStats, getCitizenDashboard } from '../controllers/statsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/citizen', authenticateToken, getCitizenDashboard);
router.get('/admin', authenticateToken, requireRole('staff', 'admin'), getAdminStats);

export default router;

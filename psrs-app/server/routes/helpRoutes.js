import express from 'express';
import { getFaqs, submitSupportTicket, getSupportTickets } from '../controllers/helpController.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/faqs', getFaqs);
router.post('/tickets', optionalAuth, submitSupportTicket);
router.get('/tickets', authenticateToken, requireRole('staff', 'admin'), getSupportTickets);

export default router;

import express from 'express';
import {
  initiatePayment,
  confirmPayment,
  getPaymentReceipt,
  getAllPayments
} from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/initiate', authenticateToken, initiatePayment);
router.post('/confirm', authenticateToken, confirmPayment);
router.get('/receipt/:id', authenticateToken, getPaymentReceipt);
router.get('/', authenticateToken, getAllPayments);

export default router;

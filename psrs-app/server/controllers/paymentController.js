import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from '../utils/notify.js';

function generateSimulatedMpesaCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'QK';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const initiatePayment = (req, res) => {
  try {
    const { application_id, payment_method = 'mpesa', phone_number } = req.body;
    const userId = req.user.id;

    if (!application_id) {
      return res.status(400).json({ success: false, message: 'Application ID is required.' });
    }

    const app = db.get(`
      SELECT a.*, s.name as service_name, s.fee_kes, u.phone as user_phone
      FROM applications a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `, [application_id]);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role === 'citizen' && app.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this application.' });
    }

    if (app.fee_kes <= 0) {
      return res.status(400).json({ success: false, message: 'This is a complimentary public service with no statutory fee.' });
    }

    // Check existing completed payment
    const existingPayment = db.get('SELECT * FROM payments WHERE application_id = ? AND status = \'Completed\'', [application_id]);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Statutory fee for this application has already been remitted and verified.',
        payment: existingPayment
      });
    }

    const payPhone = phone_number || req.user.phone;
    if (payment_method === 'mpesa' && !/^(?:\+254|0)[17]\d{8}$/.test(payPhone.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Kenyan mobile number for M-Pesa STK push.' });
    }

    const paymentId = crypto.randomUUID();
    const referenceNumber = `PAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const txRef = payment_method === 'mpesa' ? generateSimulatedMpesaCode() : `CARD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO payments (
        id, reference_number, application_id, user_id, amount_kes,
        payment_method, phone_number, transaction_reference, status, is_simulated, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 1, ?)`,
      [paymentId, referenceNumber, application_id, userId, app.fee_kes, payment_method, payPhone.trim(), txRef, now]
    );

    logAudit({
      userId,
      userEmail: req.user.email,
      action: 'PAYMENT_INITIATED',
      entityType: 'payment',
      entityId: paymentId,
      details: { referenceNumber, amount_kes: app.fee_kes, method: payment_method, is_simulated: true },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Simulated payment checkout initialized. (Sandbox Mode)',
      payment: {
        id: paymentId,
        reference_number: referenceNumber,
        amount_kes: app.fee_kes,
        payment_method,
        phone_number: payPhone.trim(),
        transaction_reference: txRef,
        is_simulated: true,
        simulation_notice: 'SIMULATION SANDBOX: Confirming this prompt simulates real Kenyan M-Pesa Express STK without debiting real funds.'
      }
    });
  } catch (err) {
    console.error('Initiate payment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initiate payment transaction.' });
  }
};

export const confirmPayment = (req, res) => {
  try {
    const { payment_id, simulation_action = 'approve' } = req.body;
    const userId = req.user.id;

    const payment = db.get('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (req.user.role === 'citizen' && payment.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (payment.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Payment is already settled.' });
    }

    const now = new Date().toISOString();

    if (simulation_action === 'cancel') {
      db.run('UPDATE payments SET status = \'Failed\' WHERE id = ?', [payment_id]);
      return res.json({ success: false, message: 'Simulated payment was cancelled by user.' });
    }

    // Settle payment
    db.run(
      'UPDATE payments SET status = \'Completed\', paid_at = ? WHERE id = ?',
      [now, payment_id]
    );

    // If application was in Draft, promote to Submitted
    const app = db.get('SELECT * FROM applications WHERE id = ?', [payment.application_id]);
    if (app && app.status === 'Draft') {
      db.run('UPDATE applications SET status = \'Submitted\', updated_at = ? WHERE id = ?', [now, app.id]);

      const histId = crypto.randomUUID();
      db.run(
        `INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_by_user_id, remarks, timestamp)
         VALUES (?, ?, 'Draft', 'Submitted', ?, ?, ?)`,
        [histId, app.id, userId, `Statutory fee of KES ${payment.amount_kes.toLocaleString()} settled via simulated M-Pesa (${payment.transaction_reference}). Application submitted.`, now]
      );
    }

    createNotification({
      userId: payment.user_id,
      title: 'Payment Confirmed',
      message: `Statutory fee of KES ${payment.amount_kes.toLocaleString()} confirmed (Receipt #${payment.reference_number}).`,
      link: `/citizen/payments/${payment_id}`,
      type: 'payment'
    });

    logAudit({
      userId,
      userEmail: req.user.email,
      action: 'PAYMENT_COMPLETED',
      entityType: 'payment',
      entityId: payment_id,
      details: { referenceNumber: payment.reference_number, amount_kes: payment.amount_kes, txRef: payment.transaction_reference },
      req
    });

    return res.json({
      success: true,
      message: 'Payment confirmed successfully. Official receipt generated.',
      receipt_number: payment.reference_number,
      transaction_reference: payment.transaction_reference
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm payment transaction.' });
  }
};

export const getPaymentReceipt = (req, res) => {
  try {
    const { id } = req.params;

    const receipt = db.get(`
      SELECT
        p.*,
        a.reference_number as application_reference,
        s.name as service_name, s.department as service_department, s.category as service_category,
        u.full_name as citizen_name, u.national_id as citizen_id, u.email as citizen_email, u.phone as citizen_phone
      FROM payments p
      JOIN applications a ON p.application_id = a.id
      JOIN services s ON a.service_id = s.id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? OR p.reference_number = ?
    `, [id, id]);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found.' });
    }

    if (req.user.role === 'citizen' && receipt.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this receipt.' });
    }

    return res.json({
      success: true,
      receipt: {
        ...receipt,
        disclaimer: 'SIMULATED DEMONSTRATION RECEIPT — Issued by Kenyan Public Service Request Sandbox. No actual government revenues collected.'
      }
    });
  } catch (err) {
    console.error('Get receipt error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
};

export const getAllPayments = (req, res) => {
  try {
    const { status, method, search, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    // If citizen, only view own payments
    if (req.user.role === 'citizen') {
      where += ' AND p.user_id = ?';
      params.push(req.user.id);
    }

    if (status && status !== 'All') {
      where += ' AND p.status = ?';
      params.push(status);
    }

    if (method && method !== 'All') {
      where += ' AND p.payment_method = ?';
      params.push(method);
    }

    if (search) {
      where += ' AND (p.reference_number LIKE ? OR p.transaction_reference LIKE ? OR u.full_name LIKE ? OR a.reference_number LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const countRow = db.get(
      `SELECT COUNT(p.id) as total, COALESCE(SUM(CASE WHEN p.status = 'Completed' THEN p.amount_kes ELSE 0 END), 0) as total_revenue
       FROM payments p
       JOIN applications a ON p.application_id = a.id
       JOIN users u ON p.user_id = u.id
       ${where}`,
      params
    );

    const list = db.query(
      `SELECT
        p.*,
        a.reference_number as application_reference,
        s.name as service_name,
        u.full_name as citizen_name, u.national_id as citizen_national_id
       FROM payments p
       JOIN applications a ON p.application_id = a.id
       JOIN services s ON a.service_id = s.id
       JOIN users u ON p.user_id = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return res.json({
      success: true,
      total: countRow ? countRow.total : 0,
      total_revenue_kes: countRow ? countRow.total_revenue : 0,
      page: pageNum,
      totalPages: Math.ceil((countRow?.total || 0) / pageSize),
      payments: list
    });
  } catch (err) {
    console.error('Get all payments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment records.' });
  }
};

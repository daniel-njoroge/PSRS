import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from '../utils/notify.js';

// Generate institutional reference number: PSRS-YYYY-CAT-XXXXX
function generateReferenceNumber(category) {
  const year = new Date().getFullYear();
  const catCode = (category || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `PSRS-${year}-${catCode}-${randomSuffix}`;
}

export const submitApplication = (req, res) => {
  try {
    const { service_id, form_data, is_draft } = req.body;
    const userId = req.user.id;

    if (!service_id) {
      return res.status(400).json({ success: false, message: 'Service ID is required.' });
    }

    const service = db.get('SELECT * FROM services WHERE id = ? AND is_active = 1', [service_id]);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found or currently inactive.' });
    }

    let parsedFormData = {};
    try {
      parsedFormData = typeof form_data === 'string' ? JSON.parse(form_data) : (form_data || {});
    } catch {
      parsedFormData = {};
    }

    // Validate required fields if not draft
    const serviceFields = JSON.parse(service.form_fields || '[]');
    const isDraft = Boolean(is_draft === 'true' || is_draft === true);

    if (!isDraft) {
      for (const field of serviceFields) {
        if (field.required && (!parsedFormData[field.name] || String(parsedFormData[field.name]).trim() === '')) {
          return res.status(400).json({
            success: false,
            message: `Field "${field.label || field.name}" is mandatory.`
          });
        }
      }
    }

    const appId = crypto.randomUUID();
    const referenceNumber = generateReferenceNumber(service.category);
    const initialStatus = isDraft ? 'Draft' : 'Submitted';
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO applications (
        id, reference_number, user_id, service_id, status, form_data,
        action_required_note, rejection_reason, approval_remarks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      [appId, referenceNumber, userId, service_id, initialStatus, JSON.stringify(parsedFormData), now, now]
    );

    // Process uploaded documents if present
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const docId = crypto.randomUUID();
        const docName = file.fieldname || 'Supporting Document';
        const filePath = `/uploads/${file.filename}`;

        db.run(
          `INSERT INTO application_documents (
            id, application_id, document_name, original_filename, stored_filename, file_path, file_size_bytes, mime_type, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [docId, appId, docName, file.originalname, file.filename, filePath, file.size, file.mimetype, now]
        );
      }
    }

    // Record initial status history
    const histId = crypto.randomUUID();
    db.run(
      `INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_by_user_id, remarks, timestamp)
       VALUES (?, ?, NULL, ?, ?, ?, ?)`,
      [histId, appId, initialStatus, userId, isDraft ? 'Application draft saved.' : 'Application lodged by citizen.', now]
    );

    // Create notification
    if (!isDraft) {
      createNotification({
        userId,
        title: 'Application Lodged Successfully',
        message: `Your application for "${service.name}" has been received with Reference #${referenceNumber}.`,
        link: `/citizen/applications/${appId}`,
        type: 'status_update'
      });
    }

    // Audit log
    logAudit({
      userId,
      userEmail: req.user.email,
      action: isDraft ? 'APPLICATION_SAVED_DRAFT' : 'APPLICATION_SUBMITTED',
      entityType: 'application',
      entityId: appId,
      details: { referenceNumber, serviceName: service.name, fee_kes: service.fee_kes },
      req
    });

    return res.status(201).json({
      success: true,
      message: isDraft ? 'Draft application saved.' : 'Application submitted successfully.',
      applicationId: appId,
      referenceNumber,
      status: initialStatus,
      fee_kes: service.fee_kes
    });
  } catch (err) {
    console.error('Submit application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to lodge application.' });
  }
};

export const getMyApplications = (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search } = req.query;

    let query = `
      SELECT
        a.id, a.reference_number, a.status, a.created_at, a.updated_at, a.action_required_note,
        s.name as service_name, s.category as service_category, s.department as service_department,
        s.fee_kes, s.processing_time_days,
        p.status as payment_status, p.amount_kes as paid_amount, p.transaction_reference
      FROM applications a
      JOIN services s ON a.service_id = s.id
      LEFT JOIN payments p ON p.application_id = a.id
      WHERE a.user_id = ?
    `;
    const params = [userId];

    if (status && status !== 'All') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (a.reference_number LIKE ? OR s.name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY a.created_at DESC';

    const applications = db.query(query, params);

    return res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    console.error('Get my applications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
};

export const getApplicationById = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const app = db.get(`
      SELECT
        a.*,
        s.name as service_name, s.category as service_category, s.department as service_department,
        s.fee_kes, s.processing_time_days, s.required_documents as service_required_docs,
        u.full_name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
        u.national_id as applicant_national_id, u.county as applicant_county, u.sub_county as applicant_sub_county,
        st.full_name as assigned_staff_name, st.email as assigned_staff_email
      FROM applications a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users st ON a.assigned_staff_id = st.id
      WHERE a.id = ?
    `, [id]);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application record not found.' });
    }

    // Role-based access control
    if (userRole === 'citizen' && app.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access forbidden. You cannot view another citizen’s application.' });
    }

    // Fetch documents
    const documents = db.query(
      'SELECT id, document_name, original_filename, stored_filename, file_path, file_size_bytes, mime_type, uploaded_at FROM application_documents WHERE application_id = ? ORDER BY uploaded_at ASC',
      [id]
    );

    // Fetch status history with actor names
    const statusHistory = db.query(`
      SELECT h.*, u.full_name as changed_by_name, u.role as changed_by_role
      FROM application_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.application_id = ?
      ORDER BY h.timestamp ASC
    `, [id]);

    // Fetch payment record
    const payment = db.get(
      'SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    const formatted = {
      ...app,
      form_data: JSON.parse(app.form_data || '{}'),
      service_required_docs: JSON.parse(app.service_required_docs || '[]'),
      documents,
      statusHistory,
      payment: payment || null
    };

    return res.json({ success: true, application: formatted });
  } catch (err) {
    console.error('Get application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve application details.' });
  }
};

export const getAllApplications = (req, res) => {
  try {
    const { status, category, department, assigned, search, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Department staff restriction: staff sees applications for their department if set
    if (req.user.role === 'staff' && req.user.department) {
      whereClause += ' AND s.department = ?';
      params.push(req.user.department);
    }

    if (status && status !== 'All') {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (category && category !== 'All') {
      whereClause += ' AND s.category = ?';
      params.push(category);
    }

    if (department && department !== 'All') {
      whereClause += ' AND s.department = ?';
      params.push(department);
    }

    if (assigned === 'me') {
      whereClause += ' AND a.assigned_staff_id = ?';
      params.push(req.user.id);
    } else if (assigned === 'unassigned') {
      whereClause += ' AND a.assigned_staff_id IS NULL';
    }

    if (search) {
      whereClause += ' AND (a.reference_number LIKE ? OR u.full_name LIKE ? OR u.national_id LIKE ? OR s.name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const countRow = db.get(
      `SELECT COUNT(a.id) as total
       FROM applications a
       JOIN services s ON a.service_id = s.id
       JOIN users u ON a.user_id = u.id
       ${whereClause}`,
      params
    );

    const totalCount = countRow ? countRow.total : 0;

    const listQuery = `
      SELECT
        a.id, a.reference_number, a.status, a.created_at, a.updated_at,
        s.name as service_name, s.category as service_category, s.department as service_department, s.fee_kes,
        u.full_name as applicant_name, u.national_id as applicant_national_id, u.county as applicant_county,
        st.full_name as assigned_staff_name,
        p.status as payment_status
      FROM applications a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users st ON a.assigned_staff_id = st.id
      LEFT JOIN payments p ON p.application_id = a.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const applications = db.query(listQuery, [...params, pageSize, offset]);

    return res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      applications
    });
  } catch (err) {
    console.error('Get all applications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve application records.' });
  }
};

export const updateApplicationStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, action_required_note, rejection_reason, approval_remarks } = req.body;
    const staffId = req.user.id;

    const validStatuses = ['Under Review', 'Action Required', 'Approved', 'Rejected', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of [${validStatuses.join(', ')}]` });
    }

    const app = db.get(`
      SELECT a.*, s.name as service_name, u.email as applicant_email
      FROM applications a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `, [id]);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const prevStatus = app.status;
    const now = new Date().toISOString();

    let cleanActionNote = app.action_required_note;
    let cleanRejectionReason = app.rejection_reason;
    let cleanApprovalRemarks = app.approval_remarks;

    if (status === 'Action Required') {
      cleanActionNote = action_required_note || remarks || 'Additional documentation or clarification is required.';
    } else if (status === 'Rejected') {
      cleanRejectionReason = rejection_reason || remarks || 'Application does not satisfy statutory requirements.';
    } else if (status === 'Approved') {
      cleanApprovalRemarks = approval_remarks || remarks || 'Application verified and approved by registrar.';
    }

    db.run(
      `UPDATE applications SET
        status = ?, action_required_note = ?, rejection_reason = ?, approval_remarks = ?, updated_at = ?
       WHERE id = ?`,
      [status, cleanActionNote, cleanRejectionReason, cleanApprovalRemarks, now, id]
    );

    // Insert into immutable history
    const histId = crypto.randomUUID();
    db.run(
      `INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_by_user_id, remarks, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [histId, id, prevStatus, status, staffId, remarks || `Status transitioned to ${status}`, now]
    );

    // Notify citizen
    const notifMessages = {
      'Under Review': `Your application #${app.reference_number} is now actively under review by an officer.`,
      'Action Required': `Action Required on application #${app.reference_number}: ${cleanActionNote}`,
      'Approved': `Your application #${app.reference_number} has been APPROVED. Official certificate or permit is being issued.`,
      'Rejected': `Your application #${app.reference_number} was rejected: ${cleanRejectionReason}`,
      'Completed': `Application #${app.reference_number} is complete. You may download your finalized official document.`
    };

    createNotification({
      userId: app.user_id,
      title: `Application Status: ${status}`,
      message: notifMessages[status] || `Status updated for #${app.reference_number}`,
      link: `/citizen/applications/${id}`,
      type: status === 'Action Required' ? 'action_required' : 'status_update'
    });

    logAudit({
      userId: staffId,
      userEmail: req.user.email,
      action: 'STATUS_UPDATED',
      entityType: 'application',
      entityId: id,
      details: { referenceNumber: app.reference_number, previousStatus: prevStatus, newStatus: status, remarks },
      req
    });

    return res.json({
      success: true,
      message: `Application #${app.reference_number} status updated to "${status}".`,
      status
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

export const assignStaff = (req, res) => {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;

    const app = db.get('SELECT * FROM applications WHERE id = ?', [id]);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    let staffUser = null;
    if (staff_id) {
      staffUser = db.get('SELECT id, full_name, email, role FROM users WHERE id = ? AND role IN (\'staff\', \'admin\')', [staff_id]);
      if (!staffUser) {
        return res.status(400).json({ success: false, message: 'Selected staff member does not exist or lacks officer permissions.' });
      }
    }

    const now = new Date().toISOString();
    db.run('UPDATE applications SET assigned_staff_id = ?, updated_at = ? WHERE id = ?', [staff_id || null, now, id]);

    // Record in history
    const histId = crypto.randomUUID();
    const remarks = staffUser ? `Assigned to processing officer ${staffUser.full_name}.` : 'Application unassigned.';
    db.run(
      `INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_by_user_id, remarks, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [histId, id, app.status, app.status, req.user.id, remarks, now]
    );

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'STAFF_ASSIGNED',
      entityType: 'application',
      entityId: id,
      details: { referenceNumber: app.reference_number, assignedStaffName: staffUser?.full_name || 'None' },
      req
    });

    return res.json({
      success: true,
      message: staffUser ? `Application assigned to ${staffUser.full_name}.` : 'Application unassigned.'
    });
  } catch (err) {
    console.error('Assign staff error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign staff officer.' });
  }
};

export const resolveCitizenAction = (req, res) => {
  try {
    const { id } = req.params;
    const { clarification_notes } = req.body;
    const userId = req.user.id;

    const app = db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [id, userId]);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
    }

    if (app.status !== 'Action Required') {
      return res.status(400).json({ success: false, message: 'Application does not have pending action required.' });
    }

    const now = new Date().toISOString();

    // Handle any newly uploaded documents
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const docId = crypto.randomUUID();
        const docName = file.fieldname || 'Rectified Document';
        const filePath = `/uploads/${file.filename}`;

        db.run(
          `INSERT INTO application_documents (
            id, application_id, document_name, original_filename, stored_filename, file_path, file_size_bytes, mime_type, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [docId, id, docName, file.originalname, file.filename, filePath, file.size, file.mimetype, now]
        );
      }
    }

    // Transition status back to Under Review
    db.run(
      `UPDATE applications SET status = 'Under Review', action_required_note = NULL, updated_at = ? WHERE id = ?`,
      [now, id]
    );

    const histId = crypto.randomUUID();
    db.run(
      `INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_by_user_id, remarks, timestamp)
       VALUES (?, ?, 'Action Required', 'Under Review', ?, ?, ?)`,
      [histId, id, userId, `Citizen addressed requested corrections: ${clarification_notes || 'Rectified documents uploaded.'}`, now]
    );

    logAudit({
      userId,
      userEmail: req.user.email,
      action: 'ACTION_RESOLVED_BY_CITIZEN',
      entityType: 'application',
      entityId: id,
      details: { referenceNumber: app.reference_number },
      req
    });

    return res.json({
      success: true,
      message: 'Rectified documents and clarification submitted. Application returned to Under Review.'
    });
  } catch (err) {
    console.error('Resolve citizen action error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit clarification.' });
  }
};

export const trackByReference = (req, res) => {
  try {
    const { ref } = req.params;
    if (!ref) {
      return res.status(400).json({ success: false, message: 'Reference number is required.' });
    }

    const cleanRef = ref.trim().toUpperCase();

    const app = db.get(`
      SELECT
        a.id, a.reference_number, a.status, a.created_at, a.updated_at,
        s.name as service_name, s.category as service_category, s.department as service_department,
        s.processing_time_days
      FROM applications a
      JOIN services s ON a.service_id = s.id
      WHERE a.reference_number = ?
    `, [cleanRef]);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: `No public record found with Reference Number "${cleanRef}". Please verify the code on your submission receipt.`
      });
    }

    // Fetch public timeline milestones
    const timeline = db.query(`
      SELECT previous_status, new_status, timestamp, remarks
      FROM application_status_history
      WHERE application_id = ?
      ORDER BY timestamp ASC
    `, [app.id]);

    return res.json({
      success: true,
      record: {
        reference_number: app.reference_number,
        service_name: app.service_name,
        category: app.service_category,
        department: app.service_department,
        current_status: app.status,
        submitted_at: app.created_at,
        last_updated: app.updated_at,
        estimated_days: app.processing_time_days,
        milestones: timeline.map(t => ({
          status: t.new_status,
          timestamp: t.timestamp,
          public_note: t.remarks
        }))
      }
    });
  } catch (err) {
    console.error('Public track error:', err);
    return res.status(500).json({ success: false, message: 'Unable to track request at this time.' });
  }
};

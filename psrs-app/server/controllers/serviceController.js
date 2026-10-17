import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAllServices = (req, res) => {
  try {
    const { category, search, includeInactive } = req.query;
    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (!includeInactive || req.user?.role !== 'admin') {
      query += ' AND is_active = 1';
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR department LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY category ASC, name ASC';

    const services = db.query(query, params).map(svc => ({
      ...svc,
      is_active: Boolean(svc.is_active),
      required_documents: JSON.parse(svc.required_documents || '[]'),
      form_fields: JSON.parse(svc.form_fields || '[]')
    }));

    return res.json({ success: true, count: services.length, services });
  } catch (err) {
    console.error('Get all services error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve services.' });
  }
};

export const getServiceByIdOrSlug = (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const svc = db.get('SELECT * FROM services WHERE id = ? OR slug = ?', [idOrSlug, idOrSlug]);

    if (!svc) {
      return res.status(404).json({ success: false, message: 'Public service not found.' });
    }

    const formatted = {
      ...svc,
      is_active: Boolean(svc.is_active),
      required_documents: JSON.parse(svc.required_documents || '[]'),
      form_fields: JSON.parse(svc.form_fields || '[]')
    };

    return res.json({ success: true, service: formatted });
  } catch (err) {
    console.error('Get service error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve service.' });
  }
};

export const getCategories = (req, res) => {
  try {
    const categories = db.query(`
      SELECT category, COUNT(id) as service_count
      FROM services
      WHERE is_active = 1
      GROUP BY category
      ORDER BY category ASC
    `);

    return res.json({ success: true, categories });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
};

export const createService = (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      department,
      description,
      eligibility,
      required_documents,
      fee_kes,
      processing_time_days,
      instructions,
      form_fields
    } = req.body;

    if (!name || !category || !department || !description) {
      return res.status(400).json({ success: false, message: 'Name, category, department, and description are required.' });
    }

    const autoSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = db.get('SELECT id FROM services WHERE slug = ?', [autoSlug]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'A service with this identifier or slug already exists.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO services (
        id, slug, name, category, department, description, eligibility,
        required_documents, fee_kes, processing_time_days, instructions, form_fields, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        autoSlug,
        name.trim(),
        category.trim(),
        department.trim(),
        description.trim(),
        eligibility || 'All eligible Kenyan citizens and registered entities.',
        JSON.stringify(required_documents || []),
        parseFloat(fee_kes || 0),
        parseInt(processing_time_days || 1, 10),
        instructions || 'Complete the digital application form, upload mandatory verification documents, and remit statutory fee if applicable.',
        JSON.stringify(form_fields || []),
        now,
        now
      ]
    );

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'SERVICE_CREATED',
      entityType: 'service',
      entityId: id,
      details: { name, category, fee_kes },
      req
    });

    return res.status(201).json({ success: true, message: 'Service published successfully.', serviceId: id });
  } catch (err) {
    console.error('Create service error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create service.' });
  }
};

export const updateService = (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      department,
      description,
      eligibility,
      required_documents,
      fee_kes,
      processing_time_days,
      instructions,
      form_fields,
      is_active
    } = req.body;

    const existing = db.get('SELECT id FROM services WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const now = new Date().toISOString();

    db.run(
      `UPDATE services SET
        name = ?, category = ?, department = ?, description = ?, eligibility = ?,
        required_documents = ?, fee_kes = ?, processing_time_days = ?, instructions = ?,
        form_fields = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      [
        name.trim(),
        category.trim(),
        department.trim(),
        description.trim(),
        eligibility,
        JSON.stringify(required_documents || []),
        parseFloat(fee_kes || 0),
        parseInt(processing_time_days || 1, 10),
        instructions,
        JSON.stringify(form_fields || []),
        is_active ? 1 : 0,
        now,
        id
      ]
    );

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'SERVICE_UPDATED',
      entityType: 'service',
      entityId: id,
      details: { name },
      req
    });

    return res.json({ success: true, message: 'Service updated successfully.' });
  } catch (err) {
    console.error('Update service error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
};

export const toggleServiceStatus = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT id, name, is_active FROM services WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const newStatus = existing.is_active ? 0 : 1;
    const now = new Date().toISOString();

    db.run('UPDATE services SET is_active = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: newStatus === 1 ? 'SERVICE_ACTIVATED' : 'SERVICE_DEACTIVATED',
      entityType: 'service',
      entityId: id,
      details: { name: existing.name, is_active: newStatus },
      req
    });

    return res.json({
      success: true,
      message: `Service ${newStatus === 1 ? 'activated' : 'disabled'} successfully.`,
      is_active: Boolean(newStatus)
    });
  } catch (err) {
    console.error('Toggle status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle service status.' });
  }
};

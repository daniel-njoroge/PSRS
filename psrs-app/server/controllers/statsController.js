import { db } from '../db/database.js';

export const getAdminStats = (req, res) => {
  try {
    // Application status counts
    const statusRows = db.query(`
      SELECT status, COUNT(id) as count
      FROM applications
      GROUP BY status
    `);

    const statusCounts = {
      Draft: 0,
      Submitted: 0,
      'Under Review': 0,
      'Action Required': 0,
      Approved: 0,
      Rejected: 0,
      Completed: 0
    };
    let totalApplications = 0;
    for (const row of statusRows) {
      if (statusCounts[row.status] !== undefined) {
        statusCounts[row.status] = row.count;
      }
      totalApplications += row.count;
    }

    // Revenue collected
    const revRow = db.get(`
      SELECT COALESCE(SUM(amount_kes), 0) as total_rev, COUNT(id) as total_tx
      FROM payments
      WHERE status = 'Completed'
    `);

    // Citizens count
    const usersRow = db.get(`
      SELECT
        COUNT(CASE WHEN role = 'citizen' THEN 1 END) as citizens_count,
        COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff_count,
        COUNT(id) as total_users
      FROM users
    `);

    // Category breakdown
    const categoryBreakdown = db.query(`
      SELECT s.category, COUNT(a.id) as application_count,
             COALESCE(SUM(CASE WHEN p.status = 'Completed' THEN p.amount_kes ELSE 0 END), 0) as revenue_kes
      FROM services s
      LEFT JOIN applications a ON a.service_id = s.id
      LEFT JOIN payments p ON p.application_id = a.id
      GROUP BY s.category
      ORDER BY application_count DESC
    `);

    // County breakdown (geographic distribution in Kenya)
    const countyBreakdown = db.query(`
      SELECT u.county, COUNT(a.id) as count
      FROM applications a
      JOIN users u ON a.user_id = u.id
      GROUP BY u.county
      ORDER BY count DESC
      LIMIT 8
    `);

    // Recent administrative activity
    const recentActivity = db.query(`
      SELECT l.id, l.user_email, l.action, l.entity_type, l.entity_id, l.details, l.timestamp,
             u.full_name as user_name, u.role as user_role
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 10
    `).map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details || '{}') : log.details
    }));

    return res.json({
      success: true,
      stats: {
        totalApplications,
        pendingReview: statusCounts['Submitted'] + statusCounts['Under Review'],
        actionRequired: statusCounts['Action Required'],
        approved: statusCounts['Approved'],
        completed: statusCounts['Completed'],
        rejected: statusCounts['Rejected'],
        statusCounts,
        revenueKes: revRow ? revRow.total_rev : 0,
        transactionsCount: revRow ? revRow.total_tx : 0,
        citizensCount: usersRow ? usersRow.citizens_count : 0,
        staffCount: usersRow ? usersRow.staff_count : 0,
        categoryBreakdown,
        countyBreakdown,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate administrative metrics.' });
  }
};

export const getCitizenDashboard = (req, res) => {
  try {
    const userId = req.user.id;

    // Applications overview
    const appsSummary = db.query(`
      SELECT status, COUNT(id) as count
      FROM applications
      WHERE user_id = ?
      GROUP BY status
    `, [userId]);

    const counts = {
      total: 0,
      active: 0,
      actionRequired: 0,
      approvedOrCompleted: 0
    };

    for (const r of appsSummary) {
      counts.total += r.count;
      if (['Submitted', 'Under Review'].includes(r.status)) counts.active += r.count;
      if (r.status === 'Action Required') counts.actionRequired += r.count;
      if (['Approved', 'Completed'].includes(r.status)) counts.approvedOrCompleted += r.count;
    }

    // Recent applications
    const recentApps = db.query(`
      SELECT
        a.id, a.reference_number, a.status, a.created_at, a.updated_at, a.action_required_note,
        s.name as service_name, s.category as service_category, s.fee_kes,
        p.status as payment_status
      FROM applications a
      JOIN services s ON a.service_id = s.id
      LEFT JOIN payments p ON p.application_id = a.id
      WHERE a.user_id = ?
      ORDER BY a.updated_at DESC
      LIMIT 5
    `, [userId]);

    // Unread notifications count
    const unreadNotifs = db.get(`
      SELECT COUNT(id) as unread_count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    return res.json({
      success: true,
      summary: {
        totalApplications: counts.total,
        activeApplications: counts.active,
        actionRequiredCount: counts.actionRequired,
        completedCount: counts.approvedOrCompleted,
        unreadNotifications: unreadNotifs ? unreadNotifs.unread_count : 0,
        recentApplications: recentApps
      }
    });
  } catch (err) {
    console.error('Citizen dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve citizen dashboard summary.' });
  }
};

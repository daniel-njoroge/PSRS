import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';

// Ensure directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

export const sqliteDb = new DatabaseSync(config.dbPath);

// Enable WAL mode and foreign key constraints
sqliteDb.exec('PRAGMA journal_mode = WAL;');
sqliteDb.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initSchema() {
  sqliteDb.exec(`
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      national_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'staff', 'admin')),
      department TEXT,
      county TEXT NOT NULL,
      sub_county TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Public Services Catalog
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      description TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      required_documents TEXT NOT NULL, -- JSON array
      fee_kes REAL NOT NULL DEFAULT 0.0,
      processing_time_days INTEGER NOT NULL DEFAULT 1,
      instructions TEXT NOT NULL,
      form_fields TEXT NOT NULL, -- JSON array of dynamic fields
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Service Applications
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES services(id),
      status TEXT NOT NULL CHECK(status IN ('Draft', 'Submitted', 'Under Review', 'Action Required', 'Approved', 'Rejected', 'Completed')),
      form_data TEXT NOT NULL, -- JSON object
      assigned_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action_required_note TEXT,
      rejection_reason TEXT,
      approval_remarks TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Application Uploaded Documents
    CREATE TABLE IF NOT EXISTS application_documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      document_name TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    -- Status Transition History (Immutable Audit)
    CREATE TABLE IF NOT EXISTS application_status_history (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_by_user_id TEXT REFERENCES users(id),
      remarks TEXT,
      timestamp TEXT NOT NULL
    );

    -- Payments Table (Real ledger of fees & simulated gateway records)
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount_kes REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('mpesa', 'card', 'bank_transfer')),
      phone_number TEXT,
      transaction_reference TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Pending', 'Completed', 'Failed')),
      is_simulated INTEGER NOT NULL DEFAULT 1,
      paid_at TEXT,
      created_at TEXT NOT NULL
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL CHECK(type IN ('status_update', 'payment', 'action_required', 'system')),
      created_at TEXT NOT NULL
    );

    -- Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal', 'important', 'urgent')),
      is_published INTEGER NOT NULL DEFAULT 1,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    -- System Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT, -- JSON
      ip_address TEXT,
      timestamp TEXT NOT NULL
    );

    -- FAQs Table
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    -- Support Inquiries
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
      created_at TEXT NOT NULL
    );

    -- Indexes for high performance lookup
    CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_apps_service ON applications(service_id);
    CREATE INDEX IF NOT EXISTS idx_apps_ref ON applications(reference_number);
    CREATE INDEX IF NOT EXISTS idx_payments_app ON payments(application_id);
    CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(reference_number);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `);
}

// Database helper wrapper
export const db = {
  raw: sqliteDb,
  query(sql, params = []) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params);
  },
  get(sql, params = []) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params);
  },
  run(sql, params = []) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.run(...params);
  },
  exec(sql) {
    return sqliteDb.exec(sql);
  }
};

// Initialize schema on load
initSchema();

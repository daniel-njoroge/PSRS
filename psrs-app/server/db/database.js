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

function migrateRequestCategories() {
  const table = sqliteDb.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'service_requests'"
  ).get();
  if (!table?.sql.includes("'Water & Sanitation'") && !table?.sql.includes("'Waste & Sanitation'")) {
    return;
  }

  sqliteDb.exec('PRAGMA foreign_keys = OFF; PRAGMA legacy_alter_table = ON;');
  let transactionStarted = false;
  try {
    sqliteDb.exec('BEGIN IMMEDIATE;');
    transactionStarted = true;
    sqliteDb.exec(`
      ALTER TABLE service_requests RENAME TO service_requests_legacy;

      CREATE TABLE service_requests (
        id TEXT PRIMARY KEY,
        reference_number TEXT NOT NULL UNIQUE,
        citizen_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        image_path TEXT,
        status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Resolved')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO service_requests
        (id, reference_number, citizen_id, category, location, description, image_path, status, created_at, updated_at)
      SELECT id, reference_number, citizen_id,
        CASE category
          WHEN 'Water & Sanitation' THEN 'Water Services'
          WHEN 'Waste & Sanitation' THEN 'Waste Management'
          ELSE category
        END,
        location, description, image_path, status, created_at, updated_at
      FROM service_requests_legacy;

      DROP TABLE service_requests_legacy;
    `);
    sqliteDb.exec('COMMIT;');
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) sqliteDb.exec('ROLLBACK;');
    throw error;
  } finally {
    sqliteDb.exec('PRAGMA legacy_alter_table = OFF; PRAGMA foreign_keys = ON;');
  }
  sqliteDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_requests_citizen ON service_requests(citizen_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests(created_at);
  `);
  const violations = sqliteDb.prepare('PRAGMA foreign_key_check').all();
  if (violations.length) {
    throw new Error('Request category migration left invalid database relationships.');
  }
}

// Initialize tables
export function initSchema() {
  sqliteDb.exec(`
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL CHECK(type IN ('status_update', 'system')),
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

    -- Indexes for high performance lookup
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      reference_number TEXT NOT NULL UNIQUE,
      citizen_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      image_path TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Resolved')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_status_history (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      previous_status TEXT CHECK(previous_status IS NULL OR previous_status IN ('Pending', 'In Progress', 'Resolved')),
      new_status TEXT NOT NULL CHECK(new_status IN ('Pending', 'In Progress', 'Resolved')),
      changed_by_user_id TEXT REFERENCES users(id),
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_requests_citizen ON service_requests(citizen_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_request_history_request ON request_status_history(request_id, created_at);
  `);
  migrateRequestCategories();
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
  },
  transaction(callback) {
    sqliteDb.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }
};

// Initialize schema on load without modifying existing citizen data.
initSchema();

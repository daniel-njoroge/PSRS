import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db, initSchema } from './database.js';

async function ensureUser({ id, fullName, nationalId, email, role, password, phone }) {
  let user = db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (user) return user.id;
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const columns = new Set(db.query('PRAGMA table_info(users)').map((column) => column.name));
    if (columns.has('national_id')) {
      db.run(
        `INSERT INTO users
          (id, full_name, national_id, email, phone, password_hash, role, county, sub_county, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Nairobi', 'Nairobi', 'active', ?, ?)`,
        [id, fullName, nationalId, email, phone, passwordHash, role, now, now]
      );
    } else {
    db.run(
        `INSERT INTO users (id, full_name, email, phone, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [id, fullName, email, phone, passwordHash, role, now, now]
    );
    }
    user = db.get('SELECT id FROM users WHERE email = ?', [email]);
    return user.id;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`Cannot create demo account ${email}: its email or national ID is already in use.`);
    }
    throw error;
  }
}

async function runSeed() {
  initSchema();
  const adminId = await ensureUser({
    id: 'demo-admin',
    fullName: 'PSRS Administrator',
    nationalId: '99000001',
    email: 'admin@psrs.go.ke',
    role: 'admin',
    password: 'Admin@2026',
    phone: '0700000001'
  });
  const citizenId = await ensureUser({
    id: 'demo-citizen',
    fullName: 'Faith Wanjiku',
    nationalId: '99000002',
    email: 'citizen@example.ke',
    role: 'citizen',
    password: 'Citizen@2026',
    phone: '0712345678'
  });

  const now = Date.now();
  const sampleRequests = [
    {
      reference: 'PSR-2026-DEMO001',
      category: 'Roads & Lighting',
      location: 'Ngong Road near Adams Arcade',
      description: 'Streetlight is not working along the footpath.',
      status: 'Pending',
      ageDays: 0
    },
    {
      reference: 'PSR-2026-DEMO002',
      category: 'Water Services',
      location: 'Westlands, near the community centre',
      description: 'Water is leaking from a public pipe.',
      status: 'In Progress',
      ageDays: 2
    },
    {
      reference: 'PSR-2026-DEMO003',
      category: 'Waste Management',
      location: 'Kilimani, along Wood Avenue',
      description: 'Garbage collection was missed this week.',
      status: 'Resolved',
      ageDays: 7
    }
  ];

  for (const sample of sampleRequests) {
    const createdAt = new Date(now - sample.ageDays * 86400000).toISOString();
    const updatedAt = sample.status === 'Pending' ? createdAt : new Date(now - 3600000).toISOString();
    let request = db.get('SELECT id FROM service_requests WHERE reference_number = ?', [sample.reference]);
    if (!request) {
      const requestId = crypto.randomUUID();
      db.run(
        `INSERT INTO service_requests
          (id, reference_number, citizen_id, category, location, description, image_path, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
        [requestId, sample.reference, citizenId, sample.category, sample.location, sample.description, sample.status, createdAt, updatedAt]
      );
      const history = sample.status === 'Resolved' ? ['Pending', 'In Progress', 'Resolved'] :
        sample.status === 'In Progress' ? ['Pending', 'In Progress'] : ['Pending'];
      history.forEach((status, index) => {
        const historyTimestamp = new Date(
          new Date(createdAt).getTime() +
          (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) * index / Math.max(1, history.length - 1)
        ).toISOString();
        db.run(
          `INSERT INTO request_status_history
            (id, request_id, previous_status, new_status, changed_by_user_id, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            requestId,
            index === 0 ? null : history[index - 1],
            status,
            index === 0 ? citizenId : adminId,
            index === 0 ? 'Request submitted' : `Request marked ${status.toLowerCase()}`,
            historyTimestamp
          ]
        );
      });
      request = { id: requestId };
    }
  }

  console.log('Request demo data is ready. Existing records were preserved.');
  console.log('Admin: admin@psrs.go.ke / Admin@2026');
  console.log('Citizen: citizen@example.ke / Citizen@2026');
}

runSeed().catch((error) => {
  console.error('Request seed failed:', error);
  process.exitCode = 1;
});

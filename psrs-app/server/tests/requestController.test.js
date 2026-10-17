import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

process.env.DB_PATH = ':memory:';

const { db } = await import('../db/database.js');
const {
  REQUEST_CATEGORIES,
  createRequest,
  getDemoRequests,
  getAllRequests,
  getMyRequests,
  getRequestById,
  getRequestStats,
  trackRequest,
  updateRequestStatus
} = await import('../controllers/requestController.js');
const { requireRole } = await import('../middleware/auth.js');

const citizen = { id: 'citizen-test', full_name: 'Test Citizen', email: 'citizen@example.test', role: 'citizen' };
const otherCitizen = { id: 'other-citizen-test', full_name: 'Other Citizen', email: 'other@example.test', role: 'citizen' };
const admin = { id: 'admin-test', full_name: 'Test Admin', email: 'admin@example.test', role: 'admin' };

function makeRequest(user, { body = {}, params = {}, query = {}, files } = {}) {
  return { user, body, params, query, files, headers: {}, socket: { remoteAddress: '127.0.0.1' } };
}

async function call(handler, req) {
  let status = 200;
  let body;
  const res = {
    status(code) { status = code; return this; },
    json(value) { body = value; return this; }
  };
  await handler(req, res);
  return { status, body };
}

beforeEach(() => {
  db.exec(`
    DELETE FROM request_status_history;
    DELETE FROM service_requests;
    DELETE FROM notifications;
    DELETE FROM audit_logs;
    DELETE FROM users;
  `);
  const now = new Date().toISOString();
  for (const user of [citizen, otherCitizen, admin]) {
    db.run(
      `INSERT INTO users (id, full_name, email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, 'test-hash', ?, 'active', ?, ?)`,
      [user.id, user.full_name, user.email, user.role, now, now]
    );
  }
});

test('citizens submit requests that follow Pending → In Progress → Resolved', async () => {
  const created = await call(createRequest, makeRequest(citizen, {
    body: {
      category: 'Roads & Lighting',
      location: 'Ngong Road near Adams Arcade',
      description: 'Streetlight is not working.'
    }
  }));
  assert.equal(created.status, 201);
  assert.equal(created.body.request.status, 'Pending');
  assert.match(created.body.request.reference_number, /^PSR-\d{4}-[A-F0-9]{8}$/);

  const list = await call(getMyRequests, makeRequest(citizen));
  assert.equal(list.body.requests.length, 1);
  assert.equal(list.body.requests[0].id, created.body.request.id);

  const adminList = await call(getAllRequests, makeRequest(admin));
  assert.equal(adminList.body.count, 1);
  assert.equal(adminList.body.requests[0].citizen_name, citizen.full_name);

  const inProgress = await call(updateRequestStatus, makeRequest(admin, {
    params: { id: created.body.request.id },
    body: { status: 'In Progress', note: 'Repair crew assigned.' }
  }));
  assert.equal(inProgress.status, 200);

  const resolved = await call(updateRequestStatus, makeRequest(admin, {
    params: { id: created.body.request.id },
    body: { status: 'Resolved' }
  }));
  assert.equal(resolved.status, 200);

  const detail = await call(getRequestById, makeRequest(citizen, { params: { id: created.body.request.id } }));
  assert.deepEqual(detail.body.request.history.map((entry) => entry.status), ['Pending', 'In Progress', 'Resolved']);
  assert.equal(detail.body.request.status, 'Resolved');

  const tracking = await call(trackRequest, makeRequest(null, {
    params: { referenceNumber: created.body.request.reference_number.toLowerCase() }
  }));
  assert.equal(tracking.status, 200);
  assert.equal(tracking.body.request.status, 'Resolved');
  assert.equal('location' in tracking.body.request, false);
  assert.equal('description' in tracking.body.request, false);
  assert.equal('citizen_id' in tracking.body.request, false);

  const stats = await call(getRequestStats, makeRequest(admin));
  assert.deepEqual(
    { total: stats.body.stats.total, open: stats.body.stats.open, resolved: stats.body.stats.resolved },
    { total: 1, open: 0, resolved: 1 }
  );
});

test('invalid categories, non-owner detail access, and skipped statuses are rejected', async () => {
  for (const category of ['Passport', 'Water & Sanitation', 'Waste & Sanitation']) {
    const invalid = await call(createRequest, makeRequest(citizen, {
      body: { category, location: 'Town', description: 'Not a supported request category' }
    }));
    assert.equal(invalid.status, 400, `${category} should not be accepted`);
  }

  for (const category of REQUEST_CATEGORIES) {
    const valid = await call(createRequest, makeRequest(citizen, {
      body: { category, location: 'Market Street', description: `A ${category} issue.` }
    }));
    assert.equal(valid.status, 201, `${category} should be accepted`);
  }

  const created = await call(createRequest, makeRequest(citizen, {
    body: {
      category: 'Water Services',
      location: 'Market Street',
      description: 'Water pipe leak.'
    }
  }));
  const forbidden = await call(getRequestById, makeRequest(otherCitizen, { params: { id: created.body.request.id } }));
  assert.equal(forbidden.status, 403);

  const skipped = await call(updateRequestStatus, makeRequest(admin, {
    params: { id: created.body.request.id },
    body: { status: 'Resolved' }
  }));
  assert.equal(skipped.status, 400);

  let deniedStatus = 200;
  let passed = false;
  requireRole('admin')(
    { user: citizen },
    { status(code) { deniedStatus = code; return this; }, json() { return this; } },
    () => { passed = true; }
  );
  assert.equal(deniedStatus, 403);
  assert.equal(passed, false);
});

test('public demo list includes only trackable seeded references without private details', async () => {
  const now = new Date().toISOString();
  for (const [reference, category, status] of [
    ['PSR-2026-DEMO001', 'Roads & Lighting', 'Pending'],
    ['PSR-2026-DEMO002', 'Water Services', 'In Progress'],
    ['PSR-2026-DEMO003', 'Waste Management', 'Resolved'],
    ['PSR-2026-OTHER001', 'Public Facilities', 'Pending']
  ]) {
    db.run(
      `INSERT INTO service_requests
        (id, reference_number, citizen_id, category, location, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Private location', 'Private description', ?, ?, ?)`,
      [reference, reference, citizen.id, category, status, now, now]
    );
  }

  const result = await call(getDemoRequests, makeRequest(null));
  assert.equal(result.status, 200);
  assert.deepEqual(
    result.body.requests.map(({ reference_number, status }) => [reference_number, status]),
    [
      ['PSR-2026-DEMO001', 'Pending'],
      ['PSR-2026-DEMO002', 'In Progress'],
      ['PSR-2026-DEMO003', 'Resolved']
    ]
  );
  for (const request of result.body.requests) {
    assert.equal('location' in request, false);
    assert.equal('description' in request, false);
    assert.equal('citizen_id' in request, false);
    const tracked = await call(trackRequest, makeRequest(null, {
      params: { referenceNumber: request.reference_number }
    }));
    assert.equal(tracked.status, 200, `${request.reference_number} should be trackable`);
    assert.equal(tracked.body.request.status, request.status);
  }
});

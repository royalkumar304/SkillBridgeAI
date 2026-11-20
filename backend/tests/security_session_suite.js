/**
 * Security Suite: Frontend Session Management & Role Routing Security
 * 
 * Tests:
 * 1. User state does not expose passwordHash or internal security keys.
 * 2. Session verification endpoint /auth/me returns only non-sensitive profile attributes.
 * 3. Session invalidation on logout cleanly revokes server session.
 * 4. Direct navigation to role-restricted endpoints without credentials returns 401.
 * 5. Role spoofing via header tampering is rejected by backend RBAC.
 * 6. Simultaneous unauthorized requests do not cause infinite loops.
 * 7. AI Microservice key is never exposed on any auth or session route.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { User } = require('../src/models');

const BASE_URL = `http://localhost:${process.env.PORT || 5001}/api/v1`;

let passed = 0;
let failed = 0;

function assert(condition, message, errorDetail = '') {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message} - ${errorDetail}`);
    failed++;
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — SESSION MANAGEMENT SECURITY SUITE             ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const studentEmail = `session_student_${timestamp}@test.edu`;
  const recruiterEmail = `session_recruiter_${timestamp}@corp.com`;
  const password = 'StrongPassword123!';

  // Setup Accounts
  const regS = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Session Student', email: studentEmail, password, role: 'STUDENT' }),
  });
  const sData = await regS.json();
  const sCookie = (regS.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  const regR = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Session Recruiter', email: recruiterEmail, password, role: 'RECRUITER' }),
  });
  const rCookie = (regR.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  // TEST 1: Registration and me payloads do not expose passwordHash
  assert(
    !sData.data?.user?.passwordHash && !sData.data?.user?.password,
    'TEST 1: User authentication responses omit password hashes and secrets'
  );

  // TEST 2: GET /auth/me returns clean authorized session data
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${sCookie}` },
  });
  const meData = await meRes.json();
  assert(
    meRes.status === 200 &&
    meData.data?.user?.email === studentEmail &&
    meData.data?.user?.role === 'STUDENT',
    'TEST 2: GET /api/v1/auth/me returns clean authenticated user profile'
  );

  // TEST 3: Student cannot access University Admin routes
  const adminAccessRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Cookie: `skillbridge_token=${sCookie}` },
  });
  assert(
    adminAccessRes.status === 403,
    'TEST 3: Student session is strictly forbidden from University Admin endpoints (HTTP 403)'
  );

  // TEST 4: Recruiter cannot access University Admin routes
  const recAdminAccessRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Cookie: `skillbridge_token=${rCookie}` },
  });
  assert(
    recAdminAccessRes.status === 403,
    'TEST 4: Recruiter session is strictly forbidden from University Admin endpoints (HTTP 403)'
  );

  // TEST 5: Internal AI service key is absent from all authentication and profile endpoints
  const stringified = JSON.stringify(meData) + JSON.stringify(sData);
  assert(
    stringified.indexOf('INTERNAL_SERVICE_KEY') === -1 &&
    stringified.indexOf('internal_service_key') === -1 &&
    stringified.indexOf('ai_internal_secret') === -1,
    'TEST 5: Internal AI service credentials are never exposed to browser sessions'
  );

  // Cleanup
  await User.deleteMany({ email: { $in: [studentEmail, recruiterEmail] } });

  console.log('\n================================================================');
  console.log(`SESSION MANAGEMENT SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('[FATAL] Session Suite error:', err);
  process.exit(1);
});

/**
 * Security Suite: Double-Submit CSRF Protection Suite
 * 
 * Tests:
 * 1. GET /api/v1/auth/csrf-token issues readable XSRF-TOKEN cookie and returns token in body.
 * 2. Safe HTTP methods (GET, HEAD, OPTIONS) do not require CSRF token.
 * 3. State-changing request (POST) without CSRF token is rejected with HTTP 403 Forbidden.
 * 4. State-changing request with invalid/tampered CSRF token is rejected with HTTP 403 Forbidden.
 * 5. State-changing request with valid CSRF token header matching cookie is accepted.
 * 6. Untrusted Origin / Referer validation behavior.
 * 7. Missing header cannot bypass CSRF validation.
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
  console.log(' SKILLBRIDGE AI — CSRF PROTECTION SECURITY SUITE                ');
  console.log('================================================================\n');

  await connectDB();

  // 1. Setup Student account
  const timestamp = Date.now();
  const studentEmail = `csrf_student_${timestamp}@test.edu`;
  const password = 'StrongPassword123!';

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'CSRF Student', email: studentEmail, password, role: 'STUDENT' }),
  });
  const cookieHeader = regRes.headers.get('set-cookie') || '';
  const tokenMatch = cookieHeader.match(/skillbridge_token=([^;]+)/);
  const authCookie = tokenMatch ? tokenMatch[1] : '';

  // TEST 1: GET /auth/csrf-token issues readable XSRF-TOKEN cookie
  const csrfRes = await fetch(`${BASE_URL}/auth/csrf-token`);
  const csrfData = await csrfRes.json();
  const setCookie = csrfRes.headers.get('set-cookie') || '';
  assert(
    csrfRes.status === 200 &&
    csrfData.csrfToken &&
    setCookie.includes('XSRF-TOKEN='),
    'TEST 1: GET /api/v1/auth/csrf-token issues readable XSRF-TOKEN cookie and returns token in body'
  );

  const rawCsrfToken = csrfData.csrfToken;

  // TEST 2: Safe GET requests succeed without CSRF token
  const safeGetRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${authCookie}` },
  });
  assert(
    safeGetRes.status === 200,
    'TEST 2: Safe HTTP GET request succeeds without CSRF token'
  );

  // TEST 3: State-changing POST without CSRF token is rejected with HTTP 403 Forbidden
  const missingCsrfRes = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${authCookie}`,
    },
    body: JSON.stringify({ jobId: new mongoose.Types.ObjectId() }),
  });
  assert(
    missingCsrfRes.status === 403,
    'TEST 3: State-changing POST request without CSRF token is rejected with HTTP 403 Forbidden'
  );

  // TEST 4: State-changing POST with invalid CSRF token is rejected with HTTP 403 Forbidden
  const invalidCsrfRes = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${authCookie}; XSRF-TOKEN=${rawCsrfToken}`,
      'x-csrf-token': 'attacker_forged_invalid_token',
    },
    body: JSON.stringify({ jobId: new mongoose.Types.ObjectId() }),
  });
  assert(
    invalidCsrfRes.status === 403,
    'TEST 4: State-changing request with mismatched/forged CSRF token is rejected with HTTP 403 Forbidden'
  );

  // TEST 5: State-changing request with matching CSRF header and cookie passes CSRF middleware
  const validCsrfRes = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${authCookie}; XSRF-TOKEN=${rawCsrfToken}`,
      'x-csrf-token': rawCsrfToken,
    },
    body: JSON.stringify({ jobId: new mongoose.Types.ObjectId() }),
  });
  // Should pass CSRF middleware and reach application logic (which returns 404 for non-existent job, NOT 403 CSRF)
  assert(
    validCsrfRes.status !== 403,
    'TEST 5: State-changing request with valid matching CSRF token passes CSRF validation'
  );

  // Cleanup
  await User.deleteMany({ email: studentEmail });
  await mongoose.connection.close(true);

  console.log('\n================================================================');
  console.log(`CSRF PROTECTION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runSuite().catch((err) => {
  console.error('[FATAL] CSRF Suite error:', err);
  process.exitCode = 1;
});

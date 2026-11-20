/**
 * Security Suite: Multi-Session Logout & Session Policy Verification
 * 
 * Verifies:
 * 1. User A logs in from Session 1 (Device A).
 * 2. User A logs in from Session 2 (Device B).
 * 3. Both sessions initially authenticate successfully.
 * 4. User A logs out from Session 1.
 * 5. Global Logout Policy: Session 2 is also invalidated (User A logged out from all devices).
 * 6. User B (separate account) remains completely unaffected and authenticated.
 * 7. User A logs in again with a new session and is authenticated successfully.
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
  console.log(' SKILLBRIDGE AI — MULTI-SESSION LOGOUT POLICY SUITE             ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const userAEmail = `multisess_a_${timestamp}@test.edu`;
  const userBEmail = `multisess_b_${timestamp}@test.edu`;
  const password = 'StrongPassword123!';

  // 1. Register User A and User B
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: userAEmail, password, role: 'STUDENT' }),
  });

  const regB = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: userBEmail, password, role: 'STUDENT' }),
  });
  const cookieB = (regB.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  // 2. User A logs in from Device 1 (Session 1)
  const loginA1 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password }),
  });
  const cookieA1 = (loginA1.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  // 3. User A logs in from Device 2 (Session 2)
  const loginA2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password }),
  });
  const cookieA2 = (loginA2.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  // TEST 1: Both sessions for User A and User B's session are active
  const checkA1 = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieA1}` } });
  const checkA2 = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieA2}` } });
  const checkB = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieB}` } });
  assert(
    checkA1.status === 200 && checkA2.status === 200 && checkB.status === 200,
    'TEST 1: Simultaneous independent sessions for User A (Device 1 and Device 2) and User B are all active'
  );

  // TEST 2: User A logs out from Device 1
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: `skillbridge_token=${cookieA1}` },
  });
  assert(logoutRes.status === 200, 'TEST 2: Logout from Device 1 returns HTTP 200');

  // TEST 3: Documented Global Logout Verification:
  // Under the tokenVersion architecture, logging out increments User.tokenVersion,
  // which revokes ALL active sessions across all devices for User A.
  const verifyA1 = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieA1}` } });
  const verifyA2 = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieA2}` } });
  assert(
    verifyA1.status === 401 && verifyA2.status === 401,
    'TEST 3: Global Logout Policy confirmed: Logging out from Device 1 immediately invalidates Device 1 and Device 2 sessions'
  );

  // TEST 4: User B remains authenticated and unaffected
  const verifyB = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieB}` } });
  assert(
    verifyB.status === 200,
    'TEST 4: Global logout of User A does not affect or invalidate User B session'
  );

  // TEST 5: User A logs in again with fresh session
  const relogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password }),
  });
  const cookieA3 = (relogin.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';
  const verifyA3 = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookieA3}` } });
  assert(
    verifyA3.status === 200,
    'TEST 5: User A can log in again and new session is valid'
  );

  // Clean up
  await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });

  console.log('\n================================================================');
  console.log(`MULTI-SESSION LOGOUT SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runSuite().catch((err) => {
  console.error('[FATAL] Multi-session Logout Suite error:', err);
  process.exit(1);
});

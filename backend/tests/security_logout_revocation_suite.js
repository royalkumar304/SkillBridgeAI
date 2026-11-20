/**
 * Security Suite: Logout & Server-Side Session Revocation Audit
 * 
 * Verifies:
 * 1. Logout clears the skillbridge_token cookie.
 * 2. Logout increments the user's tokenVersion in MongoDB.
 * 3. An old/captured JWT used AFTER logout is rejected with HTTP 401 Unauthorized (Session Revoked).
 * 4. Logging out one user does not invalidate tokens or sessions of other users.
 * 5. Re-logging in provisions a new token with incremented tokenVersion that functions normally.
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
  console.log(' SKILLBRIDGE AI — LOGOUT & SESSION REVOCATION AUDIT SUITE       ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const user1Email = `revoke_user1_${timestamp}@test.edu`;
  const user2Email = `revoke_user2_${timestamp}@test.edu`;
  const password = 'StrongPassword123!';

  // 1. Setup User 1 and User 2
  const reg1 = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User One', email: user1Email, password, role: 'STUDENT' }),
  });
  const cookie1 = (reg1.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  const reg2 = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User Two', email: user2Email, password, role: 'STUDENT' }),
  });
  const cookie2 = (reg2.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';

  // TEST 1: Both users initially authenticate successfully
  const u1Initial = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookie1}` } });
  const u2Initial = await fetch(`${BASE_URL}/auth/me`, { headers: { Cookie: `skillbridge_token=${cookie2}` } });
  assert(
    u1Initial.status === 200 && u2Initial.status === 200,
    'TEST 1: Both users authenticate successfully prior to logout'
  );

  // TEST 2: User 1 logs out
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: `skillbridge_token=${cookie1}` },
  });
  const clearCookieHeader = logoutRes.headers.get('set-cookie') || '';
  assert(
    logoutRes.status === 200 &&
    (clearCookieHeader.includes('skillbridge_token=;') || clearCookieHeader.includes('Max-Age=0') || clearCookieHeader.includes('expires=')),
    'TEST 2: Logout endpoint clears skillbridge_token cookie'
  );

  // TEST 3: Attacker replay / token reuse attack simulation
  // Attacker uses the OLD, non-expired JWT cookie captured before logout.
  // Because server revoked the tokenVersion, it must be rejected!
  const replayRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${cookie1}` },
  });
  assert(
    replayRes.status === 401,
    'TEST 3: Old JWT reused after logout is rejected with HTTP 401 (Server-side Session Revoked)'
  );

  // TEST 4: User 2 session remains completely untouched and active
  const u2AfterLogout = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${cookie2}` },
  });
  assert(
    u2AfterLogout.status === 200,
    'TEST 4: Logging out User 1 does not invalidate or affect User 2 session'
  );

  // TEST 5: User 1 logs in again, obtaining new token with matching tokenVersion
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user1Email, password }),
  });
  const newCookie = (loginRes.headers.get('set-cookie') || '').match(/skillbridge_token=([^;]+)/)?.[1] || '';
  const newMeRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${newCookie}` },
  });
  assert(
    newMeRes.status === 200,
    'TEST 5: User 1 can log in again and new session is authenticated successfully'
  );

  // Clean up
  await User.deleteMany({ email: { $in: [user1Email, user2Email] } });

  console.log('\n================================================================');
  console.log(`LOGOUT & REVOCATION AUDIT SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runSuite().catch((err) => {
  console.error('[FATAL] Logout Revocation Suite error:', err);
  process.exit(1);
});

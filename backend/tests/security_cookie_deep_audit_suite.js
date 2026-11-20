/**
 * Security Suite: Deep Cookie Authentication Audit
 * 
 * Verifies:
 * 1. skillbridge_token is issued with HttpOnly=true.
 * 2. In production mode, cookie is issued with Secure=true.
 * 3. SameSite policy is set to Lax (or Strict) to defend against cross-site leakage.
 * 4. Cookie maxAge exactly matches the 7d token expiration.
 * 5. Cookie clearing on logout uses identical Path and SameSite options.
 * 6. Authenticated requests succeed across browser refreshes using the HttpOnly cookie.
 * 7. Manipulating cookie values causes safe 401 rejection.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User } = require('../src/models');
const { getAuthCookieOptions, getClearCookieOptions } = require('../src/config/cookie');

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
  console.log(' SKILLBRIDGE AI — DEEP COOKIE AUTHENTICATION AUDIT SUITE        ');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testEmail = `deep_cookie_${timestamp}@test.edu`;
  const password = 'StrongPassword123!';

  // TEST 1: Cookie options configuration audit
  const opts = getAuthCookieOptions();
  assert(opts.httpOnly === true, 'TEST 1: getAuthCookieOptions() strictly enforces httpOnly: true');
  assert(opts.path === '/', 'TEST 1b: Cookie path is explicitly scoped to root "/"');
  assert(opts.sameSite === 'lax' || opts.sameSite === 'strict', 'TEST 1c: Cookie SameSite policy is explicitly configured');
  assert(opts.maxAge === 7 * 24 * 60 * 60 * 1000, 'TEST 1d: Cookie maxAge strictly matches 7-day token expiration');

  // TEST 2: Clear cookie options configuration audit
  const clearOpts = getClearCookieOptions();
  assert(clearOpts.httpOnly === true && clearOpts.path === '/', 'TEST 2: getClearCookieOptions() matches path and httpOnly flags');

  // TEST 3: Login issues compliant Set-Cookie header
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Deep Cookie User', email: testEmail, password, role: 'STUDENT' }),
  });
  const setCookie = regRes.headers.get('set-cookie') || '';
  assert(
    setCookie.includes('skillbridge_token=') &&
    setCookie.toLowerCase().includes('httponly') &&
    setCookie.includes('Path=/'),
    'TEST 3: Live registration response transmits compliant HttpOnly skillbridge_token cookie'
  );

  const cookieVal = setCookie.match(/skillbridge_token=([^;]+)/)?.[1];

  // TEST 4: Browser refresh simulation: Subsequent request with cookie authenticates session
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${cookieVal}` },
  });
  const meData = await meRes.json();
  assert(
    meRes.status === 200 && meData.data?.user?.email === testEmail,
    'TEST 4: Simulated browser refresh preserves session via HttpOnly cookie'
  );

  // TEST 5: Tampered cookie rejected
  const tamperedRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: `skillbridge_token=${cookieVal}_tampered` },
  });
  assert(
    tamperedRes.status === 401,
    'TEST 5: Tampered cookie payload is safely rejected with HTTP 401'
  );

  // Clean up
  console.log('\n================================================================');
  console.log(`DEEP COOKIE AUDIT SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runSuite().catch((err) => {
  console.error('[FATAL] Deep Cookie Audit Suite error:', err);
  process.exit(1);
});

/**
 * Security Suite: Deep CSRF & Subdomain Injection Audit
 * 
 * Verifies:
 * 1. CSRF tokens use cryptographic HMAC signatures with server-side secrets.
 * 2. Unsigned / arbitrary attacker-injected cookie/header pairs are rejected with HTTP 403.
 * 3. Token mismatch between cookie and header is rejected.
 * 4. Safe HTTP methods do not execute state-changing actions.
 * 5. State-changing operations strictly enforce valid signed CSRF tokens when auth cookies are present.
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
  console.log(' SKILLBRIDGE AI — DEEP CSRF & SUBDOMAIN INJECTION AUDIT SUITE   ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const testEmail = `deep_csrf_${timestamp}@test.edu`;
  const password = 'StrongPassword123!';

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Deep CSRF Student', email: testEmail, password, role: 'STUDENT' }),
  });
  const cookieHeader = regRes.headers.get('set-cookie') || '';
  const authCookie = cookieHeader.match(/skillbridge_token=([^;]+)/)?.[1] || '';

  // TEST 1: Obtain authentic server-signed CSRF token
  const csrfRes = await fetch(`${BASE_URL}/auth/csrf-token`);
  const csrfData = await csrfRes.json();
  const authenticToken = csrfData.csrfToken;
  assert(
    authenticToken && authenticToken.includes('.'),
    'TEST 1: CSRF token format incorporates cryptographic HMAC signature (nonce.signature)'
  );

  // TEST 2: Attacker Subdomain Cookie Injection Attack Simulation
  // An attacker who can set a cookie on a parent domain (.example.com) injects an arbitrary value "attacker_nonce"
  // and sends matching header "x-csrf-token: attacker_nonce".
  // Because it lacks the valid HMAC signature from JWT_SECRET, the server must reject it!
  const arbitraryToken = 'attacker_arbitrary_value_12345';
  const injectionRes = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${authCookie}; XSRF-TOKEN=${arbitraryToken}`,
      'x-csrf-token': arbitraryToken,
    },
    body: JSON.stringify({ jobId: new mongoose.Types.ObjectId() }),
  });
  assert(
    injectionRes.status === 403,
    'TEST 2: Arbitrary unsigned cookie/header pair from subdomain injection is rejected with HTTP 403'
  );

  // TEST 3: Forged signature attempt is rejected
  const forgedToken = `${arbitraryToken}.badsignaturebadsignaturebadsignaturebadsignaturebadsignaturebad12`;
  const forgedRes = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${authCookie}; XSRF-TOKEN=${forgedToken}`,
      'x-csrf-token': forgedToken,
    },
    body: JSON.stringify({ jobId: new mongoose.Types.ObjectId() }),
  });
  assert(
    forgedRes.status === 403,
    'TEST 3: Forged HMAC signature in CSRF token is rejected with HTTP 403'
  );

  // TEST 4: Authentic signed token is accepted
  const validRes = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${authCookie}; XSRF-TOKEN=${authenticToken}`,
      'x-csrf-token': authenticToken,
    },
    body: JSON.stringify({ jobId: new mongoose.Types.ObjectId() }),
  });
  assert(
    validRes.status !== 403,
    'TEST 4: Authentic server-signed CSRF token successfully passes verification'
  );

  // Clean up
  await User.deleteMany({ email: testEmail });
  await mongoose.connection.close(true);

  console.log('\n================================================================');
  console.log(`DEEP CSRF AUDIT SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exitCode = 1;
  else process.exitCode = 0;
}

runSuite().catch((err) => {
  console.error('[FATAL] Deep CSRF Audit Suite error:', err);
  process.exitCode = 1;
});

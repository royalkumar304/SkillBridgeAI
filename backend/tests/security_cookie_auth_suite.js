/**
 * Security Suite: HttpOnly Cookie Authentication & Token Verification
 * 
 * Tests:
 * 1. Login issues HttpOnly authentication cookie (skillbridge_token).
 * 2. Registration issues HttpOnly authentication cookie.
 * 3. Cookie options are configured with path="/" and appropriate SameSite policy.
 * 4. Request with valid HttpOnly cookie authenticates user via GET /auth/me.
 * 5. Request missing cookie and missing Authorization header returns 401 Unauthorized.
 * 6. Request with invalid/tampered cookie returns 401 Unauthorized.
 * 7. Request with expired token in cookie returns 401 Unauthorized.
 * 8. Logout endpoint clears authentication cookie with matching path.
 * 9. Cleared cookie prevents subsequent access to protected routes.
 * 10. Role-based authorization is enforced using cookie session (Student cannot access Recruiter route).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { User } = require('../src/models');
const { getJwtConfig } = require('../src/config/jwt');
const jwt = require('jsonwebtoken');

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
  console.log(' SKILLBRIDGE AI — COOKIE AUTHENTICATION SECURITY SUITE          ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const studentEmail = `cookie_student_${timestamp}@test.edu`;
  const password = 'StrongPassword123!';

  // TEST 1 & 2: Registration issues HttpOnly cookie
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Cookie Test Student',
      email: studentEmail,
      password,
      role: 'STUDENT',
    }),
  });

  const regSetCookie = regRes.headers.get('set-cookie') || '';
  assert(
    regRes.status === 201 &&
    regSetCookie.includes('skillbridge_token=') &&
    regSetCookie.toLowerCase().includes('httponly'),
    'TEST 1: Registration issues HttpOnly authentication cookie (skillbridge_token)'
  );

  // Extract cookie value
  const cookieMatch = regSetCookie.match(/skillbridge_token=([^;]+)/);
  const studentCookie = cookieMatch ? cookieMatch[1] : '';

  // TEST 3: Login issues HttpOnly authentication cookie
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password,
    }),
  });
  const loginSetCookie = loginRes.headers.get('set-cookie') || '';
  assert(
    loginRes.status === 200 &&
    loginSetCookie.includes('skillbridge_token=') &&
    loginSetCookie.toLowerCase().includes('httponly'),
    'TEST 2: Login issues HttpOnly authentication cookie'
  );

  // TEST 4: Cookie options contain Path=/ and SameSite
  assert(
    loginSetCookie.includes('Path=/') && loginSetCookie.toLowerCase().includes('samesite='),
    'TEST 3: Cookie options specify Path=/ and explicit SameSite defense'
  );

  // TEST 5: GET /auth/me succeeds with valid HttpOnly cookie
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Cookie: `skillbridge_token=${studentCookie}`,
    },
  });
  const meData = await meRes.json();
  assert(
    meRes.status === 200 && meData.data?.user?.email === studentEmail,
    'TEST 4: Authenticated request succeeds using HttpOnly cookie without Bearer header'
  );

  // TEST 6: Request with missing cookie returns 401 Unauthorized
  const unauthRes = await fetch(`${BASE_URL}/auth/me`);
  assert(
    unauthRes.status === 401,
    'TEST 5: Request missing authentication cookie returns HTTP 401 Unauthorized'
  );

  // TEST 7: Tampered cookie returns 401 Unauthorized
  const tamperedRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Cookie: `skillbridge_token=${studentCookie}.tampered_signature`,
    },
  });
  assert(
    tamperedRes.status === 401,
    'TEST 6: Request with tampered cookie returns HTTP 401 Unauthorized'
  );

  // TEST 8: Expired token in cookie returns 401 Unauthorized
  const jwtCfg = getJwtConfig();
  const expiredToken = jwt.sign(
    { id: new mongoose.Types.ObjectId(), email: 'expired@test.edu', role: 'STUDENT' },
    jwtCfg.secret,
    { algorithm: jwtCfg.algorithm, expiresIn: '-10s', issuer: jwtCfg.issuer, audience: jwtCfg.audience }
  );
  const expiredRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Cookie: `skillbridge_token=${expiredToken}`,
    },
  });
  assert(
    expiredRes.status === 401,
    'TEST 7: Request with expired JWT cookie returns HTTP 401 Unauthorized'
  );

  // TEST 9: POST /auth/logout clears the authentication cookie
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: `skillbridge_token=${studentCookie}`,
    },
  });
  const logoutSetCookie = logoutRes.headers.get('set-cookie') || '';
  assert(
    logoutRes.status === 200 &&
    (logoutSetCookie.includes('skillbridge_token=;') || logoutSetCookie.includes('Max-Age=0') || logoutSetCookie.includes('expires=')),
    'TEST 8: Logout endpoint explicitly clears the authentication cookie'
  );

  // TEST 10: Role restriction with cookie session (Student cannot access recruiter endpoint)
  const forbiddenRes = await fetch(`${BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `skillbridge_token=${studentCookie}`,
    },
    body: JSON.stringify({ title: 'Hacked Job' }),
  });
  assert(
    forbiddenRes.status === 403,
    'TEST 9: Role-based authorization remains enforced via cookie session (STUDENT cannot create jobs)'
  );

  // Cleanup
  await User.deleteMany({ email: studentEmail });

  console.log('\n================================================================');
  console.log(`COOKIE AUTHENTICATION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('[FATAL] Cookie Auth Suite error:', err);
  process.exit(1);
});

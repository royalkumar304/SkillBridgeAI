require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = require('../src/app');
const User = require('../src/models/User');
const { getJwtConfig } = require('../src/config/jwt');
const { getCsrfConfig, validateCsrfSecret } = require('../src/config/csrf');
const { AUTH_COOKIE_NAME } = require('../src/config/cookie');
const { CSRF_COOKIE_NAME } = require('../src/middleware/csrfMiddleware');

let server;
let baseUrl;

const makeRequest = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
};

const signCsrfNonce = (nonce, secret) => {
  return crypto.createHmac('sha256', secret).update(nonce).digest('hex');
};

const generateValidCsrfPair = (secret) => {
  const nonce = crypto.randomBytes(32).toString('hex');
  const signature = signCsrfNonce(nonce, secret);
  return `${nonce}.${signature}`;
};

async function runTests() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — FINAL AUTHENTICATION SECURITY GATE SUITE      ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description}`);
      failed++;
    }
  };

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillbridge_test';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    console.log('[Database] MongoDB connection established successfully.');

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`[Server] Ephemeral test server listening on ${baseUrl}\n`);
        resolve();
      });
    });

    const jwtConfig = getJwtConfig();
    const jwtSecret = jwtConfig.secret;
    const csrfSecret = getCsrfConfig().secret;

    const createValidSignedToken = (payload, options = {}) => {
      return jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        expiresIn: '15m',
        ...options,
      });
    };

    // Create test users
    const timestamp = Date.now();
    const userA = await User.create({
      name: 'Gate User A',
      email: `gate_user_a_${timestamp}@test.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      role: 'STUDENT',
      tokenVersion: 0,
      status: 'ACTIVE',
    });

    const userB = await User.create({
      name: 'Gate User B',
      email: `gate_user_b_${timestamp}@test.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      role: 'STUDENT',
      tokenVersion: 0,
      status: 'ACTIVE',
    });

    const suspendedUser = await User.create({
      name: 'Gate Suspended User',
      email: `gate_suspended_${timestamp}@test.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      role: 'STUDENT',
      tokenVersion: 0,
      status: 'SUSPENDED',
    });

    // -------------------------------------------------------------
    // GROUP 1: Fail-Closed tokenVersion Validation
    // -------------------------------------------------------------
    console.log('--- GROUP 1: Strict tokenVersion Validation ---');

    // Test 1: Missing tokenVersion in token payload rejected (401)
    const tokenMissingTv = createValidSignedToken({ id: userA._id.toString(), role: userA.role });
    const res1 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenMissingTv}` },
    });
    assert(res1.status === 401 && res1.json?.error === 'Unauthorized' && res1.json?.message?.includes('unversioned'), 'Token with missing tokenVersion is rejected with HTTP 401 unversioned');

    // Test 2: Null tokenVersion rejected (401)
    const tokenNullTv = createValidSignedToken({ id: userA._id.toString(), role: userA.role, tokenVersion: null });
    const res2 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenNullTv}` },
    });
    assert(res2.status === 401 && res2.json?.error === 'Unauthorized' && res2.json?.message?.includes('unversioned'), 'Token with null tokenVersion is rejected with HTTP 401 unversioned');

    // Test 3: String/non-number tokenVersion rejected (401)
    const tokenStringTv = createValidSignedToken({ id: userA._id.toString(), role: userA.role, tokenVersion: '0' });
    const res3 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenStringTv}` },
    });
    assert(res3.status === 401 && res3.json?.error === 'Unauthorized' && res3.json?.message?.includes('unversioned'), 'Token with string tokenVersion is rejected with HTTP 401 unversioned');

    // Test 4: Negative tokenVersion rejected (401)
    const tokenNegativeTv = createValidSignedToken({ id: userA._id.toString(), role: userA.role, tokenVersion: -1 });
    const res4 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenNegativeTv}` },
    });
    assert(res4.status === 401 && res4.json?.error === 'Unauthorized' && res4.json?.message?.includes('unversioned'), 'Token with negative tokenVersion is rejected with HTTP 401 unversioned');

    // Test 5: Mismatched tokenVersion rejected (401 Session has been revoked)
    const tokenMismatchedTv = createValidSignedToken({ id: userA._id.toString(), role: userA.role, tokenVersion: 999 });
    const res5 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenMismatchedTv}` },
    });
    assert(res5.status === 401 && res5.json?.error === 'Unauthorized' && res5.json?.message?.includes('revoked'), 'Token with mismatched tokenVersion is rejected with HTTP 401 session revoked');

    // Test 6: Inactive/suspended user rejected (401)
    const tokenSuspended = createValidSignedToken({ id: suspendedUser._id.toString(), role: suspendedUser.role, tokenVersion: 0 });
    const res6 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenSuspended}` },
    });
    assert(res6.status === 401 && res6.json?.error === 'Unauthorized' && res6.json?.message?.includes('suspended'), 'Token for suspended user is rejected with HTTP 401 Account suspended');

    // Test 7: Non-existent user rejected (401)
    const fakeId = new mongoose.Types.ObjectId();
    const tokenFakeUser = createValidSignedToken({ id: fakeId.toString(), role: 'STUDENT', tokenVersion: 0 });
    const res7 = await makeRequest('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenFakeUser}` },
    });
    assert(res7.status === 401 && res7.json?.error === 'Unauthorized' && res7.json?.message?.includes('not found'), 'Token for deleted/non-existent user is rejected with HTTP 401 User account not found');

    // -------------------------------------------------------------
    // GROUP 2: CSRF Cryptographic Key Separation & Production Enforcement
    // -------------------------------------------------------------
    console.log('\n--- GROUP 2: CSRF Key Separation & Configuration ---');

    // Test 8: validateCsrfSecret throws if NODE_ENV=production and secret missing
    let prodMissingThrew = false;
    try {
      validateCsrfSecret('', { NODE_ENV: 'production', CSRF_SIGNING_SECRET: '' });
    } catch (err) {
      prodMissingThrew = true;
    }
    assert(prodMissingThrew, 'validateCsrfSecret() throws fatal error in production when CSRF_SIGNING_SECRET is missing');

    // Test 9: validateCsrfSecret throws if NODE_ENV=production and secret < 32 chars
    let prodShortThrew = false;
    try {
      validateCsrfSecret('short_secret_under_32_chars', { NODE_ENV: 'production' });
    } catch (err) {
      prodShortThrew = true;
    }
    assert(prodShortThrew, 'validateCsrfSecret() throws fatal error in production when CSRF_SIGNING_SECRET < 32 characters');

    // Test 10: validateCsrfSecret succeeds in production with >= 32 chars
    let prodValidPassed = false;
    try {
      const validSec = validateCsrfSecret('a_very_secure_and_strong_csrf_secret_key_32_bytes', { NODE_ENV: 'production' });
      prodValidPassed = validSec === 'a_very_secure_and_strong_csrf_secret_key_32_bytes';
    } catch (_) {}
    assert(prodValidPassed, 'validateCsrfSecret() succeeds in production when CSRF_SIGNING_SECRET >= 32 characters');

    // -------------------------------------------------------------
    // GROUP 3: CSRF Double-Submit Protection & Subdomain Injection Immunity
    // -------------------------------------------------------------
    console.log('\n--- GROUP 3: CSRF Double-Submit & HMAC Defense ---');

    const validUserAToken = createValidSignedToken({
      id: userA._id.toString(),
      email: userA.email,
      role: userA.role,
      name: userA.name,
      tokenVersion: userA.tokenVersion,
    });
    const validCsrfToken = generateValidCsrfPair(csrfSecret);

    // Test 11: Cookie auth without CSRF token on PUT /api/v1/students/profile is rejected (403 EBADCSRFTOKEN)
    const res11 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${AUTH_COOKIE_NAME}=${validUserAToken}`,
      },
      body: { headline: 'New Headline' },
    });
    assert(res11.status === 403 && res11.json?.error === 'EBADCSRFTOKEN', 'Cookie-authenticated state change without CSRF token is rejected with HTTP 403 EBADCSRFTOKEN');

    // Test 12: Cookie auth with CSRF cookie but missing header on PUT is rejected (403)
    const res12 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${AUTH_COOKIE_NAME}=${validUserAToken}; ${CSRF_COOKIE_NAME}=${validCsrfToken}`,
      },
      body: { headline: 'New Headline' },
    });
    assert(res12.status === 403 && res12.json?.error === 'EBADCSRFTOKEN', 'Cookie-authenticated PUT with missing CSRF header is rejected with HTTP 403');

    // Test 13: Cookie auth with mismatched CSRF header and cookie is rejected (403)
    const otherCsrfToken = generateValidCsrfPair(csrfSecret);
    const res13 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${AUTH_COOKIE_NAME}=${validUserAToken}; ${CSRF_COOKIE_NAME}=${validCsrfToken}`,
        'x-csrf-token': otherCsrfToken,
      },
      body: { headline: 'New Headline' },
    });
    assert(res13.status === 403 && res13.json?.error === 'EBADCSRFTOKEN', 'Cookie auth with mismatched CSRF cookie and header is rejected with HTTP 403');

    // Test 14: Subdomain cookie injection immunity: forged token with invalid HMAC signature rejected (403)
    const forgedToken = `${crypto.randomBytes(32).toString('hex')}.badsignature1234567890badsignature1234567890badsignature123456789012`;
    const res14 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${AUTH_COOKIE_NAME}=${validUserAToken}; ${CSRF_COOKIE_NAME}=${forgedToken}`,
        'x-csrf-token': forgedToken,
      },
      body: { headline: 'New Headline' },
    });
    assert(res14.status === 403 && res14.json?.error === 'EBADCSRFTOKEN', 'Forged/injected CSRF token with invalid HMAC signature is rejected with HTTP 403');

    // Test 15: Valid matching signed CSRF token allows state-changing request
    const res15 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${AUTH_COOKIE_NAME}=${validUserAToken}; ${CSRF_COOKIE_NAME}=${validCsrfToken}`,
        'x-csrf-token': validCsrfToken,
      },
      body: { headline: 'Valid Student Headline' },
    });
    assert(res15.status === 200 || res15.status === 201, `Valid CSRF token and cookie allows state-changing request (Status ${res15.status})`);

    // -------------------------------------------------------------
    // GROUP 4: Safe Methods & Bearer Token Interoperability
    // -------------------------------------------------------------
    console.log('\n--- GROUP 4: Safe Methods & Bearer Exemption ---');

    // Test 16: GET request with auth cookie does not require CSRF token
    const res16 = await makeRequest('/api/v1/auth/me', {
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${validUserAToken}`,
      },
    });
    assert(res16.status === 200 && (res16.json?.data?.user?.email === userA.email || res16.json?.user?.email === userA.email), 'Safe GET method with auth cookie succeeds without CSRF headers (Status 200)');

    // Test 17: Bearer token state-changing request succeeds without CSRF header (CLI/API client)
    const res17 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validUserAToken}`,
      },
      body: { headline: 'CLI Headline Update' },
    });
    assert(res17.status === 200 || res17.status === 201, 'Non-browser Bearer token request succeeds on PUT without CSRF token');

    // Test 18: Unauthenticated request to protected route returns 401 (not masked by 403 CSRF)
    const res18 = await makeRequest('/api/v1/students/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: { headline: 'Unauthenticated update' },
    });
    assert(res18.status === 401, 'Unauthenticated PUT without cookie or Bearer returns HTTP 401 (not masked by CSRF 403)');

    // -------------------------------------------------------------
    // GROUP 5: Multi-Session Revocation & User Isolation
    // -------------------------------------------------------------
    console.log('\n--- GROUP 5: Multi-Session Revocation & User Isolation ---');

    const userATokenDev1 = createValidSignedToken({
      id: userA._id.toString(),
      email: userA.email,
      role: userA.role,
      tokenVersion: userA.tokenVersion,
    });
    const userATokenDev2 = createValidSignedToken({
      id: userA._id.toString(),
      email: userA.email,
      role: userA.role,
      tokenVersion: userA.tokenVersion,
    });
    const userBToken = createValidSignedToken({
      id: userB._id.toString(),
      email: userB.email,
      role: userB.role,
      tokenVersion: userB.tokenVersion,
    });

    // Verify both User A and User B active initially
    const preA1 = await makeRequest('/api/v1/auth/me', { headers: { Authorization: `Bearer ${userATokenDev1}` } });
    const preA2 = await makeRequest('/api/v1/auth/me', { headers: { Authorization: `Bearer ${userATokenDev2}` } });
    const preB = await makeRequest('/api/v1/auth/me', { headers: { Authorization: `Bearer ${userBToken}` } });
    assert(preA1.status === 200 && preA2.status === 200 && preB.status === 200, 'Initial sessions for User A (Device 1 & 2) and User B are valid');

    // User A logs out
    const logoutRes = await makeRequest('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userATokenDev1}` },
    });
    assert(logoutRes.status === 200, 'User A logout returns HTTP 200');

    // Test 19: User A Device 1 session revoked
    const postA1 = await makeRequest('/api/v1/auth/me', { headers: { Authorization: `Bearer ${userATokenDev1}` } });
    assert(postA1.status === 401 && postA1.json?.message?.includes('revoked'), 'User A Device 1 session immediately rejected after logout (401 Session revoked)');

    // Test 20: User A Device 2 session also revoked (Global Logout)
    const postA2 = await makeRequest('/api/v1/auth/me', { headers: { Authorization: `Bearer ${userATokenDev2}` } });
    assert(postA2.status === 401 && postA2.json?.message?.includes('revoked'), 'User A Device 2 session immediately rejected after logout (Global Logout verified)');

    // Test 21: User B session unaffected
    const postB = await makeRequest('/api/v1/auth/me', { headers: { Authorization: `Bearer ${userBToken}` } });
    assert(postB.status === 200 && (postB.json?.data?.user?.email === userB.email || postB.json?.user?.email === userB.email), 'User B session remains completely unaffected and active (User Isolation verified)');

    // Cleanup
    await User.deleteMany({ email: { $in: [userA.email, userB.email, suspendedUser.email] } });
  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log('\n================================================================');
  console.log(`FINAL GATE SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runTests();

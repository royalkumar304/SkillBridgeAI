/**
 * Comprehensive JWT Authentication Security Test Suite
 *
 * Verifies all 15 scenarios mandated by security specifications:
 * 1. Application rejects missing JWT_SECRET (Startup/config rejection).
 * 2. Application rejects weak JWT_SECRET (< 32 chars or known defaults).
 * 3. Application starts with a sufficiently strong secret (>= 32 chars).
 * 4. Valid login generates a valid JWT.
 * 5. Valid JWT authenticates successfully.
 * 6. Expired JWT is rejected.
 * 7. Incorrectly signed JWT is rejected.
 * 8. Malformed JWT is rejected.
 * 9. JWT using an unsupported algorithm is rejected (e.g. none, HS384, HS512 when restricted).
 * 10. Missing token is rejected.
 * 11. Invalid issuer is rejected when issuer validation is enabled.
 * 12. Invalid audience is rejected when audience validation is enabled.
 * 13. Student cannot access admin-only APIs.
 * 14. Recruiter cannot access admin-only APIs.
 * 15. Provisioned administrator can access authorized admin APIs.
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { validateJwtSecret, getJwtConfig, MIN_SECRET_LENGTH } = require('../src/config/jwt');
const { User } = require('../src/models');

const BASE_URL = 'http://localhost:5001/api/v1';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge_ai';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runJwtSecuritySuite() {
  console.log('================================================================');
  console.log('       SKILLBRIDGE AI — JWT SECURITY HARDENING TEST SUITE       ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const createdTestEmails = [];

  function assert(condition, testName, note = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${note}`);
      failed++;
    }
  }

  const ts = Date.now();
  const studentEmail = `jwt_student_${ts}@univ.edu`;
  const recruiterEmail = `jwt_recruiter_${ts}@company.com`;
  const password = 'Password@123';

  try {
    await mongoose.connect(MONGODB_URI);

    // -------------------------------------------------------------
    // TEST 1: Application rejects missing JWT_SECRET
    // -------------------------------------------------------------
    let missingRejected = false;
    try {
      validateJwtSecret('');
    } catch (err) {
      missingRejected = err.message.includes('missing');
    }
    assert(missingRejected, 'TEST 1: Application rejects missing JWT_SECRET');

    // -------------------------------------------------------------
    // TEST 2: Application rejects weak JWT_SECRET
    // -------------------------------------------------------------
    let shortRejected = false;
    try {
      validateJwtSecret('short_weak_secret');
    } catch (err) {
      shortRejected = err.message.includes('insufficiently long');
    }
    let defaultRejected = false;
    try {
      validateJwtSecret('super_secret_jwt_key_skillbridge_2026');
    } catch (err) {
      defaultRejected = err.message.includes('known insecure default');
    }
    assert(shortRejected && defaultRejected, 'TEST 2: Application rejects weak JWT_SECRET (< 32 chars or default fallback)');

    // -------------------------------------------------------------
    // TEST 3: Application starts / validates with sufficiently strong secret
    // -------------------------------------------------------------
    const strongRandomSecret = crypto.randomBytes(32).toString('hex');
    const validatedSecret = validateJwtSecret(strongRandomSecret);
    assert(
      validatedSecret === strongRandomSecret && validatedSecret.length >= MIN_SECRET_LENGTH,
      'TEST 3: Application accepts a cryptographically strong 256-bit secret'
    );

    // -------------------------------------------------------------
    // TEST 4: Valid login generates a valid JWT
    // -------------------------------------------------------------
    const regStudent = await request('/auth/register', {
      method: 'POST',
      body: { name: 'JWT Student', email: studentEmail, password, role: 'STUDENT' },
    });
    createdTestEmails.push(studentEmail);

    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: studentEmail, password },
    });
    const validToken = loginRes.data?.data?.token;
    const decodedUnverified = jwt.decode(validToken, { complete: true });

    assert(
      loginRes.status === 200 &&
        Boolean(validToken) &&
        decodedUnverified?.header?.alg === 'HS256' &&
        decodedUnverified?.payload?.role === 'STUDENT' &&
        decodedUnverified?.payload?.iss === 'skillbridge-ai' &&
        decodedUnverified?.payload?.aud === 'skillbridge-users',
      'TEST 4: Valid login generates a valid JWT with algorithm HS256, issuer, audience, and role claims'
    );

    // -------------------------------------------------------------
    // TEST 5: Valid JWT authenticates successfully
    // -------------------------------------------------------------
    const authMeRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert(
      authMeRes.status === 200 && authMeRes.data?.data?.user?.email === studentEmail,
      'TEST 5: Valid JWT authenticates successfully on protected endpoint GET /auth/me'
    );

    // -------------------------------------------------------------
    // TEST 6: Expired JWT is rejected
    // -------------------------------------------------------------
    const activeConfig = getJwtConfig();
    const expiredToken = jwt.sign(
      {
        id: loginRes.data?.data?.user?.id,
        email: studentEmail,
        role: 'STUDENT',
        name: 'JWT Student',
      },
      activeConfig.secret,
      {
        algorithm: 'HS256',
        expiresIn: '-10s', // expired in the past
        issuer: activeConfig.issuer,
        audience: activeConfig.audience,
      }
    );
    const expiredRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(
      expiredRes.status === 401 && (expiredRes.data?.message?.includes('expired') || expiredRes.data?.error === 'Unauthorized'),
      'TEST 6: Expired JWT is strictly rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // TEST 7: Incorrectly signed JWT is rejected
    // -------------------------------------------------------------
    const wrongSecret = crypto.randomBytes(32).toString('hex');
    const wrongSignatureToken = jwt.sign(
      {
        id: loginRes.data?.data?.user?.id,
        email: studentEmail,
        role: 'STUDENT',
        name: 'JWT Student',
      },
      wrongSecret,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: activeConfig.issuer,
        audience: activeConfig.audience,
      }
    );
    const wrongSigRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${wrongSignatureToken}` },
    });
    assert(
      wrongSigRes.status === 401 && wrongSigRes.data?.error === 'Unauthorized',
      'TEST 7: JWT signed with incorrect secret is rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // TEST 8: Malformed JWT is rejected
    // -------------------------------------------------------------
    const malformedTokens = [
      'not.a.valid.jwt',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsig',
      validToken.slice(0, 15) + 'corrupted' + validToken.slice(25),
    ];
    let allMalformedRejected = true;
    for (const badToken of malformedTokens) {
      const res = await request('/auth/me', { headers: { Authorization: `Bearer ${badToken}` } });
      if (res.status !== 401) allMalformedRejected = false;
    }
    assert(allMalformedRejected, 'TEST 8: Malformed JWT tokens are rejected with HTTP 401');

    // -------------------------------------------------------------
    // TEST 9: JWT using an unsupported algorithm is rejected
    // -------------------------------------------------------------
    // Attempt algorithm 'none'
    const noneAlgToken = jwt.sign(
      { id: loginRes.data?.data?.user?.id, email: studentEmail, role: 'STUDENT' },
      '',
      { algorithm: 'none' }
    );
    const noneRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${noneAlgToken}` },
    });
    assert(
      noneRes.status === 401,
      'TEST 9: Token using unsupported algorithm (none) is rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // TEST 10: Missing token is rejected
    // -------------------------------------------------------------
    const noHeaderRes = await request('/auth/me');
    const emptyBearerRes = await request('/auth/me', { headers: { Authorization: 'Bearer ' } });
    const invalidPrefixRes = await request('/auth/me', { headers: { Authorization: `Basic ${validToken}` } });
    assert(
      noHeaderRes.status === 401 && emptyBearerRes.status === 401 && invalidPrefixRes.status === 401,
      'TEST 10: Missing, empty, or improperly prefixed tokens are rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // TEST 11: Invalid issuer is rejected when issuer validation is enabled
    // -------------------------------------------------------------
    const badIssuerToken = jwt.sign(
      {
        id: loginRes.data?.data?.user?.id,
        email: studentEmail,
        role: 'STUDENT',
      },
      activeConfig.secret,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: 'malicious-issuer.com',
        audience: activeConfig.audience,
      }
    );
    const badIssuerRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${badIssuerToken}` },
    });
    assert(
      badIssuerRes.status === 401,
      'TEST 11: Token with invalid issuer claim is rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // TEST 12: Invalid audience is rejected when audience validation is enabled
    // -------------------------------------------------------------
    const badAudToken = jwt.sign(
      {
        id: loginRes.data?.data?.user?.id,
        email: studentEmail,
        role: 'STUDENT',
      },
      activeConfig.secret,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: activeConfig.issuer,
        audience: 'unauthorized-audience',
      }
    );
    const badAudRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${badAudToken}` },
    });
    assert(
      badAudRes.status === 401,
      'TEST 12: Token with invalid audience claim is rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // TEST 13: Student cannot access admin-only APIs
    // -------------------------------------------------------------
    const studentAdminRes = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert(
      studentAdminRes.status === 403,
      'TEST 13: Student JWT cannot access admin-only API /admin/stats (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 14: Recruiter cannot access admin-only APIs
    // -------------------------------------------------------------
    const regRecruiter = await request('/auth/register', {
      method: 'POST',
      body: { name: 'JWT Recruiter', email: recruiterEmail, password, role: 'RECRUITER' },
    });
    createdTestEmails.push(recruiterEmail);
    const recruiterToken = regRecruiter.data?.data?.token;

    const recruiterAdminRes = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    assert(
      recruiterAdminRes.status === 403,
      'TEST 14: Recruiter JWT cannot access admin-only API /admin/stats (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 15: Provisioned administrator can access authorized admin APIs
    // -------------------------------------------------------------
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@univ.edu', password: 'Password@123' },
    });
    const adminToken = adminLoginRes.data?.data?.token;

    const adminStatsRes = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminLoginRes.status === 200 && adminStatsRes.status === 200 && adminStatsRes.data?.success === true,
      'TEST 15: Provisioned administrator accesses /admin/stats with valid JWT (HTTP 200 OK)'
    );

  } catch (err) {
    console.error('[UNEXPECTED ERROR IN TEST SUITE]', err);
    failed++;
  } finally {
    if (createdTestEmails.length > 0) {
      await User.deleteMany({ email: { $in: createdTestEmails } });
    }
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`JWT SECURITY SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runJwtSecuritySuite();

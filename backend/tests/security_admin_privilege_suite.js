/**
 * Comprehensive Security Verification Suite: Admin Privilege Escalation Prevention
 *
 * Verifies all 12 scenarios mandated by security specifications:
 * TEST 1: Student registration succeeds.
 * TEST 2: Recruiter registration succeeds.
 * TEST 3: Registration with UNIVERSITY_ADMIN is rejected (HTTP 400).
 * TEST 4: Registration with ADMIN is rejected (HTTP 400).
 * TEST 5: Registration with arbitrary role SUPER_ADMIN is rejected (HTTP 400).
 * TEST 6: Manipulated API request cannot create an admin (payload tampering).
 * TEST 7: Normal student login still works.
 * TEST 8: Normal recruiter login still works.
 * TEST 9: Provisioned admin login works.
 * TEST 10: Admin-only APIs reject student and recruiter tokens (HTTP 403).
 * TEST 11: Duplicate registration remains rejected (HTTP 409).
 * TEST 12: Existing password hashing remains functional (bcrypt verification).
 */

const http = require('http');
const mongoose = require('mongoose');
const { provisionAdmin } = require('../scripts/provisionAdmin');
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

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('   SKILLBRIDGE AI — ADMIN PRIVILEGE ESCALATION SECURITY SUITE   ');
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
  const studentEmail = `sec_student_${ts}@univ.edu`;
  const recruiterEmail = `sec_recruiter_${ts}@company.com`;
  const adminEmail = `sec_admin_${ts}@univ.edu`;
  const password = 'Password@123';

  try {
    // Connect to DB for deep inspections and cleanups
    await mongoose.connect(MONGODB_URI);

    // TEST 1: Student registration succeeds
    const regStudent = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Security Student', email: studentEmail, password, role: 'STUDENT' },
    });
    createdTestEmails.push(studentEmail);
    assert(
      regStudent.status === 201 && regStudent.data?.data?.user?.role === 'STUDENT',
      'TEST 1: Student registration succeeds with valid role STUDENT'
    );

    // TEST 2: Recruiter registration succeeds
    const regRecruiter = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Security Recruiter', email: recruiterEmail, password, role: 'RECRUITER' },
    });
    createdTestEmails.push(recruiterEmail);
    assert(
      regRecruiter.status === 201 && regRecruiter.data?.data?.user?.role === 'RECRUITER',
      'TEST 2: Recruiter registration succeeds with valid role RECRUITER'
    );

    // TEST 3: Registration with UNIVERSITY_ADMIN is rejected (HTTP 400)
    const regAdmin = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Hacker Admin', email: `hacker_admin_${ts}@malicious.io`, password, role: 'UNIVERSITY_ADMIN' },
    });
    assert(
      regAdmin.status === 400 && regAdmin.data?.success === false,
      'TEST 3: Public registration with UNIVERSITY_ADMIN is rejected (HTTP 400)',
      `Received status ${regAdmin.status}`
    );

    // TEST 4: Registration with ADMIN is rejected (HTTP 400)
    const regAdminShort = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Hacker Root', email: `hacker_root_${ts}@malicious.io`, password, role: 'ADMIN' },
    });
    assert(
      regAdminShort.status === 400 && regAdminShort.data?.success === false,
      'TEST 4: Public registration with ADMIN is rejected (HTTP 400)',
      `Received status ${regAdminShort.status}`
    );

    // TEST 5: Registration with arbitrary role SUPER_ADMIN is rejected (HTTP 400)
    const regSuperAdmin = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Hacker Super', email: `hacker_super_${ts}@malicious.io`, password, role: 'SUPER_ADMIN' },
    });
    assert(
      regSuperAdmin.status === 400 && regSuperAdmin.data?.success === false,
      'TEST 5: Public registration with arbitrary role SUPER_ADMIN is rejected (HTTP 400)',
      `Received status ${regSuperAdmin.status}`
    );

    // TEST 6: Manipulated API request cannot create an admin (lowercase / whitespace / object injection)
    const regManipulated1 = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Tamperer 1', email: `tamper1_${ts}@test.com`, password, role: 'university_admin' },
    });
    const regManipulated2 = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Tamperer 2', email: `tamper2_${ts}@test.com`, password, role: ' UNIVERSITY_ADMIN ' },
    });
    const regManipulated3 = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Tamperer 3', email: `tamper3_${ts}@test.com`, password, role: { $ne: 'STUDENT' } },
    });
    const tamperingBlocked =
      regManipulated1.status === 400 &&
      regManipulated2.status === 400 &&
      regManipulated3.status === 400;
    assert(
      tamperingBlocked,
      'TEST 6: Manipulated API payloads attempting privilege escalation are strictly blocked'
    );

    // TEST 7: Normal student login still works
    const loginStudent = await request('/auth/login', {
      method: 'POST',
      body: { email: studentEmail, password },
    });
    const studentToken = loginStudent.data?.data?.token;
    assert(
      loginStudent.status === 200 && Boolean(studentToken) && loginStudent.data?.data?.user?.role === 'STUDENT',
      'TEST 7: Normal student login succeeds and receives valid JWT token'
    );

    // TEST 8: Normal recruiter login still works
    const loginRecruiter = await request('/auth/login', {
      method: 'POST',
      body: { email: recruiterEmail, password },
    });
    const recruiterToken = loginRecruiter.data?.data?.token;
    assert(
      loginRecruiter.status === 200 && Boolean(recruiterToken) && loginRecruiter.data?.data?.user?.role === 'RECRUITER',
      'TEST 8: Normal recruiter login succeeds and receives valid JWT token'
    );

    // TEST 9: Provisioned admin login works (Provisioned via CLI tool)
    const provisionedAdmin = await provisionAdmin({
      name: 'Authorized Provost',
      email: adminEmail,
      password,
    });
    createdTestEmails.push(adminEmail);
    assert(
      provisionedAdmin.role === 'UNIVERSITY_ADMIN',
      'TEST 9a: Secure CLI provisioning sets role to UNIVERSITY_ADMIN'
    );

    const loginAdmin = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password },
    });
    const adminToken = loginAdmin.data?.data?.token;
    assert(
      loginAdmin.status === 200 && Boolean(adminToken) && loginAdmin.data?.data?.user?.role === 'UNIVERSITY_ADMIN',
      'TEST 9b: Provisioned admin login succeeds with correct credentials'
    );

    // TEST 10: Admin-only APIs reject student and recruiter tokens (HTTP 403)
    const studentAdminAccess = await request('/admin/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const recruiterAdminAccess = await request('/admin/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    const adminAdminAccess = await request('/admin/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      studentAdminAccess.status === 403 &&
        recruiterAdminAccess.status === 403 &&
        adminAdminAccess.status === 200,
      'TEST 10: Admin-only APIs (/admin/stats) reject student (403) and recruiter (403), permit admin (200)'
    );

    // TEST 11: Duplicate registration remains rejected (HTTP 409)
    const dupStudent = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Student Duplicate', email: studentEmail, password, role: 'STUDENT' },
    });
    assert(
      dupStudent.status === 409 && dupStudent.data?.success === false,
      'TEST 11: Duplicate registration is rejected with HTTP 409 Conflict'
    );

    // TEST 12: Existing password hashing remains functional (bcrypt verification)
    const dbAdminUser = await User.findOne({ email: adminEmail }).select('+passwordHash');
    const isPasswordHashed =
      dbAdminUser &&
      dbAdminUser.passwordHash &&
      dbAdminUser.passwordHash !== password &&
      dbAdminUser.passwordHash.startsWith('$2');
    const isPasswordVerifiable = dbAdminUser ? await dbAdminUser.comparePassword(password) : false;
    assert(
      isPasswordHashed && isPasswordVerifiable,
      'TEST 12: Password hashing verified via bcrypt (salted hash, comparePassword matches)'
    );

  } catch (err) {
    console.error('[ERROR IN SUITE]', err);
    failed++;
  } finally {
    // Cleanup temporary test users created during this test
    if (createdTestEmails.length > 0) {
      await User.deleteMany({ email: { $in: createdTestEmails } });
    }
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`SECURITY VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit();

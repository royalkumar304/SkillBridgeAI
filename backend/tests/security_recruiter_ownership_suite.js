/**
 * Comprehensive Recruiter Company Ownership Authorization Test Suite
 *
 * Verifies all 15 scenarios mandated by security specifications:
 * 1. Recruiter A can create a job for their own verified company.
 * 2. Recruiter A cannot create a job for Recruiter B's verified company (HTTP 403).
 * 3. Recruiter A cannot use an arbitrary/nonexistent companyId (HTTP 404).
 * 4. Recruiter A cannot update Recruiter B's job (HTTP 403).
 * 5. Recruiter A cannot delete Recruiter B's job (HTTP 403).
 * 6. Recruiter A cannot activate/deactivate Recruiter B's job (HTTP 403).
 * 7. Recruiter A cannot transfer a job to another company by changing companyId (mass assignment protection).
 * 8. Recruiter A cannot bypass ownership by sending recruiterId or ownerId in request body.
 * 9. Unauthenticated users cannot perform protected recruiter operations (HTTP 401).
 * 10. Unverified companies cannot create or publish jobs (HTTP 403 Approval Gate).
 * 11. Authorized company owner can perform permitted operations.
 * 12. Admin permissions continue working according to existing RBAC rules.
 * 13. Nonexistent company/job IDs return safe errors (HTTP 404).
 * 14. Malformed IDs do not crash the server (HTTP 400).
 * 15. Equivalent internship ownership tests (internships inherit strict company ownership).
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User, Company, Job, Application } = require('../src/models');

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

async function runRecruiterOwnershipSuite() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — RECRUITER COMPANY OWNERSHIP SECURITY SUITE    ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const createdUserEmails = [];
  const createdCompanyIds = [];
  const createdJobIds = [];

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
  const recAEmail = `own_rec_a_${ts}@alpha.com`;
  const recBEmail = `own_rec_b_${ts}@beta.com`;
  const password = 'Password@123';

  try {
    await mongoose.connect(MONGODB_URI);

    // 1. Authenticate University Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@univ.edu', password: 'Password@123' },
    });
    const adminToken = adminLogin.data?.data?.token;
    assert(adminLogin.status === 200 && Boolean(adminToken), 'Setup: University Admin authenticated');

    // 2. Register Recruiter A and Recruiter B
    const regA = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Alice Recruiter', email: recAEmail, password, role: 'RECRUITER' },
    });
    createdUserEmails.push(recAEmail);
    const tokenA = regA.data?.data?.token;

    const regB = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Bob Recruiter', email: recBEmail, password, role: 'RECRUITER' },
    });
    createdUserEmails.push(recBEmail);
    const tokenB = regB.data?.data?.token;

    assert(Boolean(tokenA && tokenB), 'Setup: Recruiter A and Recruiter B registered');

    // 3. Set up Companies for A and B
    const compA = await Company.create({
      name: `Alpha Tech Corp (${ts})`,
      industry: 'Technology',
      recruiterUserId: regA.data?.data?.user?.id,
      location: 'Bengaluru',
      verified: true, // Verified by admin
    });
    createdCompanyIds.push(compA._id);

    const compB = await Company.create({
      name: `Beta Cloud Systems (${ts})`,
      industry: 'Cloud Infrastructure',
      recruiterUserId: regB.data?.data?.user?.id,
      location: 'Hyderabad',
      verified: true, // Verified by admin
    });
    createdCompanyIds.push(compB._id);

    // Create an unverified company for Recruiter A
    const unverifiedRecEmail = `own_rec_unver_${ts}@unver.com`;
    const regUnverified = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Unverified Recruiter', email: unverifiedRecEmail, password, role: 'RECRUITER' },
    });
    createdUserEmails.push(unverifiedRecEmail);
    const tokenUnver = regUnverified.data?.data?.token;

    const compUnverified = await Company.create({
      name: `Unverified Corp (${ts})`,
      industry: 'Technology',
      recruiterUserId: regUnverified.data?.data?.user?.id,
      location: 'Remote',
      verified: false,
    });
    createdCompanyIds.push(compUnverified._id);

    // -------------------------------------------------------------
    // TEST 1: Recruiter A can create a job for their own verified company
    // -------------------------------------------------------------
    const createJobA = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Backend Engineer',
        description: 'Build robust Node.js microservices',
        companyId: compA._id.toString(),
        jobType: 'full_time',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Node.js', weight: 50 }, { name: 'MongoDB', weight: 50 }],
      },
    });
    const jobA = createJobA.data?.data?.job;
    if (jobA?._id) createdJobIds.push(jobA._id);
    assert(
      createJobA.status === 201 && jobA && jobA.companyId === compA._id.toString(),
      'TEST 1: Recruiter A can create a job for their own verified company'
    );

    // -------------------------------------------------------------
    // TEST 2: Recruiter A cannot create a job for Recruiter B's verified company
    // -------------------------------------------------------------
    const spoofJobB = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Spoofed Job in Company B',
        description: 'Attempting unauthorized posting',
        companyId: compB._id.toString(), // Recruiter B's company
        jobType: 'full_time',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'React', weight: 100 }],
      },
    });
    assert(
      spoofJobB.status === 403,
      'TEST 2: Recruiter A cannot create a job for Recruiter B verified company (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 3: Recruiter A cannot use an arbitrary/nonexistent companyId
    // -------------------------------------------------------------
    const fakeCompanyId = new mongoose.Types.ObjectId();
    const fakeCompanyRes = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Ghost Company Job',
        description: 'Using random nonexistent companyId',
        companyId: fakeCompanyId.toString(),
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Python', weight: 100 }],
      },
    });
    assert(
      fakeCompanyRes.status === 404,
      'TEST 3: Recruiter A cannot use an arbitrary or nonexistent companyId (HTTP 404 Not Found)'
    );

    // -------------------------------------------------------------
    // Setup Job for Recruiter B
    // -------------------------------------------------------------
    const createJobB = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: {
        title: 'Cloud DevOps Specialist',
        description: 'Manage AWS and Kubernetes clusters',
        companyId: compB._id.toString(),
        jobType: 'full_time',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Docker', weight: 50 }, { name: 'AWS', weight: 50 }],
      },
    });
    const jobB = createJobB.data?.data?.job;
    if (jobB?._id) createdJobIds.push(jobB._id);

    // -------------------------------------------------------------
    // TEST 4: Recruiter A cannot update Recruiter B's job
    // -------------------------------------------------------------
    const updateJobBByA = await request(`/jobs/${jobB._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Hacked Title by Recruiter A',
      },
    });
    assert(
      updateJobBByA.status === 403,
      'TEST 4: Recruiter A cannot update Recruiter B job (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 5: Recruiter A cannot delete Recruiter B's job
    // -------------------------------------------------------------
    const deleteJobBByA = await request(`/jobs/${jobB._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      deleteJobBByA.status === 403,
      'TEST 5: Recruiter A cannot delete Recruiter B job (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 6: Recruiter A cannot activate/deactivate Recruiter B's job
    // -------------------------------------------------------------
    const statusJobBByA = await request(`/jobs/${jobB._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { status: 'closed' },
    });
    assert(
      statusJobBByA.status === 403,
      'TEST 6: Recruiter A cannot change status of Recruiter B job (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 7: Recruiter A cannot transfer a job to another company by changing companyId
    // -------------------------------------------------------------
    const massAssignAttempt = await request(`/jobs/${jobA._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Attempting transfer',
        companyId: compB._id.toString(), // Attempting to reassign companyId
      },
    });
    const refreshedJobA = await Job.findById(jobA._id);
    assert(
      massAssignAttempt.status === 200 && refreshedJobA.companyId.toString() === compA._id.toString(),
      'TEST 7: Mass-assignment transfer of companyId is blocked; companyId remains unchanged'
    );

    // -------------------------------------------------------------
    // TEST 8: Recruiter A cannot bypass ownership by sending recruiterId or ownerId in body
    // -------------------------------------------------------------
    const bypassAttempt = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Bypass Attempt Job',
        description: 'Sending spoofed recruiterId in body',
        companyId: compB._id.toString(),
        recruiterUserId: regB.data?.data?.user?.id,
        postedBy: regB.data?.data?.user?.id,
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Go', weight: 100 }],
      },
    });
    assert(
      bypassAttempt.status === 403,
      'TEST 8: Cannot bypass ownership by injecting recruiterUserId or postedBy in request body'
    );

    // -------------------------------------------------------------
    // TEST 9: Unauthenticated users cannot perform protected recruiter operations
    // -------------------------------------------------------------
    const unauthPost = await request('/jobs', {
      method: 'POST',
      body: { title: 'No Auth Job', description: 'Desc' },
    });
    const unauthDelete = await request(`/jobs/${jobA._id}`, {
      method: 'DELETE',
    });
    assert(
      unauthPost.status === 401 && unauthDelete.status === 401,
      'TEST 9: Unauthenticated requests to recruiter endpoints return HTTP 401 Unauthorized'
    );

    // -------------------------------------------------------------
    // TEST 10: Unverified companies cannot create or publish jobs
    // -------------------------------------------------------------
    const unverifiedPost = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUnver}` },
      body: {
        title: 'Unverified Company Job',
        description: 'Should be blocked by Approval Gate',
        companyId: compUnverified._id.toString(),
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Rust', weight: 100 }],
      },
    });
    assert(
      unverifiedPost.status === 403 && unverifiedPost.data?.error === 'Company Verification Required',
      'TEST 10: Unverified companies cannot create/publish jobs (HTTP 403 Approval Gate)'
    );

    // -------------------------------------------------------------
    // TEST 11: Authorized company owner can perform permitted operations
    // -------------------------------------------------------------
    const ownerUpdate = await request(`/jobs/${jobA._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { title: 'Senior Backend Engineer (Updated by Owner)' },
    });
    const ownerStatus = await request(`/jobs/${jobA._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { status: 'draft' },
    });
    assert(
      ownerUpdate.status === 200 && ownerStatus.status === 200,
      'TEST 11: Authorized company owner can update details and status of their own job'
    );

    // -------------------------------------------------------------
    // TEST 12: Admin permissions continue working according to existing RBAC rules
    // -------------------------------------------------------------
    const adminCompanyList = await request('/admin/companies', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStats = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminCompanyList.status === 200 && adminStats.status === 200,
      'TEST 12: University Admin continues accessing company governance and stats'
    );

    // -------------------------------------------------------------
    // TEST 13: Nonexistent company/job IDs return safe errors
    // -------------------------------------------------------------
    const fakeJobId = new mongoose.Types.ObjectId();
    const getFakeJob = await request(`/jobs/${fakeJobId}`);
    const updateFakeJob = await request(`/jobs/${fakeJobId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { title: 'Ghost Update' },
    });
    assert(
      getFakeJob.status === 404 && updateFakeJob.status === 404,
      'TEST 13: Nonexistent company or job IDs return safe HTTP 404 Not Found'
    );

    // -------------------------------------------------------------
    // TEST 14: Malformed IDs do not crash the server
    // -------------------------------------------------------------
    const malformedGet = await request('/jobs/invalid-id-format-1234');
    const malformedPut = await request('/jobs/invalid-id-format-1234', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { title: 'Crash Test' },
    });
    const malformedPost = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Crash Test',
        description: 'Desc',
        companyId: 'not-an-objectid',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Test', weight: 100 }],
      },
    });
    assert(
      malformedGet.status === 400 && malformedPut.status === 400 && malformedPost.status === 400,
      'TEST 14: Malformed IDs return clean HTTP 400 Validation Error without server crashes'
    );

    // -------------------------------------------------------------
    // TEST 15: Equivalent internship ownership tests
    // -------------------------------------------------------------
    const createInternshipA = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Cloud Security Intern',
        description: 'Internship with duration and workMode',
        companyId: compA._id.toString(),
        jobType: 'internship',
        duration: '6 Months',
        workMode: 'remote',
        stipend: '30000 / month',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'Security', weight: 100 }],
      },
    });
    const internshipA = createInternshipA.data?.data?.job;
    if (internshipA?._id) createdJobIds.push(internshipA._id);

    // Recruiter B tries to delete Recruiter A's internship
    const deleteInternshipByB = await request(`/jobs/${internshipA._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(
      createInternshipA.status === 201 && deleteInternshipByB.status === 403,
      'TEST 15: Internships strictly enforce company ownership (Recruiter B blocked with HTTP 403)'
    );

  } catch (err) {
    console.error('[UNEXPECTED ERROR IN TEST SUITE]', err);
    failed++;
  } finally {
    if (createdJobIds.length > 0) {
      await Job.deleteMany({ _id: { $in: createdJobIds } });
    }
    if (createdCompanyIds.length > 0) {
      await Company.deleteMany({ _id: { $in: createdCompanyIds } });
    }
    if (createdUserEmails.length > 0) {
      await User.deleteMany({ email: { $in: createdUserEmails } });
    }
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`RECRUITER OWNERSHIP RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRecruiterOwnershipSuite();

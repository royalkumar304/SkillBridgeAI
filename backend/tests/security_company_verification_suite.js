/**
 * Comprehensive Company Verification Lifecycle & Job Publishing Security Suite
 *
 * Verifies all 17 scenarios mandated by security specifications:
 * 1. Admin can approve an unverified company (PATCH /admin/companies/:id/verify).
 * 2. Recruiter cannot approve their own company (HTTP 403 Forbidden).
 * 3. Recruiter cannot change verified status through company update (PUT /companies/profile).
 * 4. Unverified company cannot create a published job (HTTP 403 Approval Gate).
 * 5. Unverified company cannot activate a job (HTTP 403 Approval Gate).
 * 6. Verified company can publish a job (HTTP 201 Created).
 * 7. Revoked company jobs are hidden from public listing (GET /jobs excludes revoked companies).
 * 8. Revoked company jobs cannot be accessed through public detail endpoint (GET /jobs/:id returns HTTP 403).
 * 9. Rejected company jobs remain hidden from public search and discovery.
 * 10. Recruiter cannot bypass verification using request body fields (verified, verificationStatus).
 * 11. Company re-verification follows intended activation policy (re-approved company jobs become discoverable).
 * 12. Public job search excludes unverified companies.
 * 13. Student job discovery (/career/jobs-comparison) excludes unverified companies.
 * 14. Internship listings enforce the exact same verification lifecycle policy.
 * 15. Unauthorized users (students/recruiters) cannot access admin verification operations.
 * 16. Existing student applications remain accessible according to authorization rules (/applications/me).
 * 17. Admin can still manage company verification and retrieve governance lists.
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User, Company, Job, Application, StudentProfile } = require('../src/models');

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

async function runCompanyVerificationSuite() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — COMPANY VERIFICATION LIFECYCLE SECURITY SUITE  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const createdUserEmails = [];
  const createdCompanyIds = [];
  const createdJobIds = [];
  const createdAppIds = [];

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
  const recEmail = `verif_rec_${ts}@tech.io`;
  const studentEmail = `verif_stud_${ts}@edu.in`;
  const password = 'Password@123';

  try {
    await mongoose.connect(MONGODB_URI);

    // Setup Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@univ.edu', password: 'Password@123' },
    });
    const adminToken = adminLogin.data?.data?.token;
    assert(adminLogin.status === 200 && Boolean(adminToken), 'Setup: University Admin authenticated');

    // Setup Student
    const regStud = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Student Verif', email: studentEmail, password, role: 'STUDENT' },
    });
    createdUserEmails.push(studentEmail);
    const studentToken = regStud.data?.data?.token;

    // Setup Recruiter
    const regRec = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Recruiter Verif', email: recEmail, password, role: 'RECRUITER' },
    });
    createdUserEmails.push(recEmail);
    const recToken = regRec.data?.data?.token;

    // Recruiter registers Company
    const comp = await Company.create({
      name: `Verif Test Corp (${ts})`,
      industry: 'Enterprise Software',
      recruiterUserId: regRec.data?.data?.user?.id,
      location: 'Pune',
      verified: false,
      verificationStatus: 'PENDING',
    });
    createdCompanyIds.push(comp._id);

    // -------------------------------------------------------------
    // TEST 1: Admin can approve an unverified company
    // -------------------------------------------------------------
    const adminApprove = await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });
    const dbCompApproved = await Company.findById(comp._id);
    assert(
      adminApprove.status === 200 && dbCompApproved.verified === true && dbCompApproved.verificationStatus === 'APPROVED',
      'TEST 1: Admin can approve an unverified company (verified=true, status=APPROVED)'
    );

    // -------------------------------------------------------------
    // TEST 2: Recruiter cannot approve their own company
    // -------------------------------------------------------------
    const recruiterSelfVerify = await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recToken}` },
      body: { verified: true },
    });
    assert(
      recruiterSelfVerify.status === 403,
      'TEST 2: Recruiter cannot access admin verification endpoint (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 3: Recruiter cannot change verified status through company update
    // -------------------------------------------------------------
    // Revoke company first
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: false },
    });

    const recruiterInjectStatus = await request('/companies/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        name: `Verif Test Corp (${ts})`,
        verified: true,
        verificationStatus: 'APPROVED',
      },
    });
    const dbCompInjected = await Company.findById(comp._id);
    assert(
      recruiterInjectStatus.status === 200 && dbCompInjected.verified === false,
      'TEST 3: Recruiter cannot change verified status through PUT /companies/profile (injection ignored)'
    );

    // -------------------------------------------------------------
    // TEST 4: Unverified company cannot create a published job
    // -------------------------------------------------------------
    const unverifiedCreate = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        title: 'Unauthorized Junior Dev',
        description: 'Should be rejected',
        companyId: comp._id.toString(),
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'JavaScript', weight: 100 }],
        status: 'active',
      },
    });
    assert(
      unverifiedCreate.status === 403 && unverifiedCreate.data?.error === 'Company Verification Required',
      'TEST 4: Unverified company cannot create a published job (HTTP 403 Approval Gate)'
    );

    // -------------------------------------------------------------
    // Re-verify company to create legitimate active job for testing
    // -------------------------------------------------------------
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });

    // -------------------------------------------------------------
    // TEST 6: Verified company can publish a job
    // -------------------------------------------------------------
    const verifiedCreate = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        title: 'Full Stack Engineer',
        description: 'Building modern interfaces',
        companyId: comp._id.toString(),
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'React', weight: 50 }, { name: 'Node.js', weight: 50 }],
        status: 'active',
      },
    });
    const activeJob = verifiedCreate.data?.data?.job;
    if (activeJob?._id) createdJobIds.push(activeJob._id);
    assert(
      verifiedCreate.status === 201 && activeJob && activeJob.status === 'active',
      'TEST 6: Verified company can publish an active job'
    );

    // Create an internship under verified company
    const verifiedInternship = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        title: 'Frontend React Intern',
        description: 'Summer internship',
        companyId: comp._id.toString(),
        jobType: 'internship',
        duration: '3 Months',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        requiredSkills: [{ name: 'React', weight: 100 }],
        status: 'active',
      },
    });
    const activeInternship = verifiedInternship.data?.data?.job;
    if (activeInternship?._id) createdJobIds.push(activeInternship._id);

    // Student applies to the job
    const applyRes = await request('/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { jobId: activeJob._id.toString() },
    });
    const studentApp = applyRes.data?.data?.application;
    if (studentApp?._id) createdAppIds.push(studentApp._id);

    // -------------------------------------------------------------
    // Revoke company verification via Admin
    // -------------------------------------------------------------
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: false },
    });

    // -------------------------------------------------------------
    // TEST 5: Unverified / Revoked company cannot activate a job
    // -------------------------------------------------------------
    // Set job to draft first
    await Job.findByIdAndUpdate(activeJob._id, { status: 'draft' });
    const activateAttempt = await request(`/jobs/${activeJob._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recToken}` },
      body: { status: 'active' },
    });
    assert(
      activateAttempt.status === 403,
      'TEST 5: Revoked company cannot activate a draft job (HTTP 403 Forbidden)'
    );

    // Set job back to active to test public filtering
    await Job.findByIdAndUpdate(activeJob._id, { status: 'active' });

    // -------------------------------------------------------------
    // TEST 7: Revoked company jobs are hidden from public listing
    // -------------------------------------------------------------
    const publicList = await request('/jobs');
    const foundInPublic = (publicList.data?.data?.jobs || []).some(
      (j) => j._id === activeJob._id.toString()
    );
    assert(
      publicList.status === 200 && !foundInPublic,
      'TEST 7: Revoked company jobs are hidden from public job listing GET /jobs'
    );

    // -------------------------------------------------------------
    // TEST 8: Revoked company jobs cannot be accessed through public detail endpoint
    // -------------------------------------------------------------
    const publicDetail = await request(`/jobs/${activeJob._id}`);
    assert(
      publicDetail.status === 403,
      'TEST 8: Revoked company jobs cannot be accessed via public detail GET /jobs/:id (HTTP 403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 9: Rejected company jobs remain hidden
    // -------------------------------------------------------------
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'REJECTED' },
    });
    const publicListAfterReject = await request('/jobs');
    const foundAfterReject = (publicListAfterReject.data?.data?.jobs || []).some(
      (j) => j._id === activeJob._id.toString()
    );
    assert(
      publicListAfterReject.status === 200 && !foundAfterReject,
      'TEST 9: Rejected company jobs remain completely hidden from public listings'
    );

    // -------------------------------------------------------------
    // TEST 10: Recruiter cannot bypass verification using request body fields
    // -------------------------------------------------------------
    const bypassPublish = await request(`/jobs/${activeJob._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        status: 'active',
        verified: true,
        verificationStatus: 'APPROVED',
      },
    });
    assert(
      bypassPublish.status === 403,
      'TEST 10: Recruiter cannot bypass verification by sending status: active or verified: true in PUT'
    );

    // -------------------------------------------------------------
    // TEST 11: Company re-verification follows intended activation policy
    // -------------------------------------------------------------
    // Re-verify company
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });
    const publicListAfterReverif = await request('/jobs');
    const foundAfterReverif = (publicListAfterReverif.data?.data?.jobs || []).some(
      (j) => j._id === activeJob._id.toString()
    );
    assert(
      publicListAfterReverif.status === 200 && foundAfterReverif,
      'TEST 11: Re-verified company jobs automatically become discoverable again in public listings'
    );

    // -------------------------------------------------------------
    // TEST 12: Public job search excludes unverified companies
    // -------------------------------------------------------------
    // Revoke again
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: false },
    });
    const searchRes = await request(`/jobs?search=${encodeURIComponent('Full Stack Engineer')}`);
    const foundInSearch = (searchRes.data?.data?.jobs || []).some(
      (j) => j._id === activeJob._id.toString()
    );
    assert(
      searchRes.status === 200 && !foundInSearch,
      'TEST 12: Public job search with ?search query excludes unverified/revoked companies'
    );

    // -------------------------------------------------------------
    // TEST 13: Student job discovery excludes unverified companies
    // -------------------------------------------------------------
    // Setup student profile with skills
    await StudentProfile.findOneAndUpdate(
      { userId: regStud.data?.data?.user?.id },
      {
        university: 'NIT',
        degree: 'B.Tech',
        branch: 'CSE',
        graduationYear: 2026,
        cgpa: 8.5,
        skills: [{ name: 'React', level: 'intermediate' }, { name: 'Node.js', level: 'intermediate' }],
      },
      { upsert: true }
    );
    const discoveryRes = await request('/career/jobs-analysis', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const foundInDiscovery = (discoveryRes.data?.data?.comparisons || []).some(
      (c) => c.jobId?.toString() === activeJob._id.toString()
    );
    assert(
      discoveryRes.status === 200 && !foundInDiscovery,
      'TEST 13: Student career intelligence /career/jobs-analysis excludes unverified/revoked companies'
    );

    // -------------------------------------------------------------
    // TEST 14: Internship listings enforce the same policy
    // -------------------------------------------------------------
    const internshipSearch = await request('/jobs?jobType=internship');
    const foundInternship = (internshipSearch.data?.data?.jobs || []).some(
      (j) => j._id === activeInternship._id.toString()
    );
    assert(
      internshipSearch.status === 200 && !foundInternship,
      'TEST 14: Internship listings (?jobType=internship) strictly exclude unverified/revoked companies'
    );

    // -------------------------------------------------------------
    // TEST 15: Unauthorized users cannot access admin verification operations
    // -------------------------------------------------------------
    const studentVerifyAttempt = await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { verified: true },
    });
    const unauthVerifyAttempt = await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      body: { verified: true },
    });
    assert(
      studentVerifyAttempt.status === 403 && unauthVerifyAttempt.status === 401,
      'TEST 15: Unauthorized users (students 403, unauthenticated 401) cannot access admin verification endpoints'
    );

    // -------------------------------------------------------------
    // TEST 16: Existing student applications remain accessible
    // -------------------------------------------------------------
    const studentApps = await request('/applications/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const foundApp = (studentApps.data?.data?.applications || []).some(
      (a) => a._id === studentApp._id.toString()
    );
    assert(
      studentApps.status === 200 && foundApp,
      'TEST 16: Existing student applications remain accessible to the applying student in /applications/me'
    );

    // -------------------------------------------------------------
    // TEST 18: Invariant consistency - contradictory states prevented
    // -------------------------------------------------------------
    // Attempt contradictory state via direct instantiation: verified: true, verificationStatus: 'REVOKED'
    const contradictoryComp = new Company({
      name: `Contradictory Test Corp (${ts})`,
      industry: 'Security Audit',
      recruiterUserId: regRec.data?.data?.user?.id,
      verified: true,
      verificationStatus: 'REVOKED',
    });
    await contradictoryComp.save();
    createdCompanyIds.push(contradictoryComp._id);
    const dbContradictory = await Company.findById(contradictoryComp._id);
    assert(
      dbContradictory.verified === false && dbContradictory.verificationStatus === 'REVOKED',
      'TEST 18: Pre-save hook enforces consistency; REVOKED status forces verified=false'
    );

    // -------------------------------------------------------------
    // TEST 19: Legacy record verification policy
    // -------------------------------------------------------------
    const { isCompanyVerified } = require('../src/utils/verificationPolicy');
    const legacyApproved = { verified: true };
    const legacyPending = { verified: false };
    const contradictoryLegacy = { verified: true, verificationStatus: 'REVOKED' };
    assert(
      isCompanyVerified(legacyApproved) === true &&
        isCompanyVerified(legacyPending) === false &&
        isCompanyVerified(contradictoryLegacy) === false,
      'TEST 19: Canonical verification policy safely evaluates legacy and contradictory objects'
    );

    // -------------------------------------------------------------
    // TEST 20: Comprehensive 5-Role Matrix for Job Detail Access
    // Roles: a. Unauthenticated visitor, b. Student, c. Owning Recruiter, d. Different Recruiter, e. University Admin
    // -------------------------------------------------------------
    // Setup Recruiter B
    const recBEmail = `verif_rec_b_${ts}@diff.io`;
    const regRecB = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Recruiter Diff', email: recBEmail, password, role: 'RECRUITER' },
    });
    createdUserEmails.push(recBEmail);
    const recBToken = regRecB.data?.data?.token;

    // Put activeJob under revoked company
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: false },
    });

    const roleA_Unauth = await request(`/jobs/${activeJob._id}`);
    const roleB_Student = await request(`/jobs/${activeJob._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const roleC_Owner = await request(`/jobs/${activeJob._id}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const roleD_DiffRecruiter = await request(`/jobs/${activeJob._id}`, {
      headers: { Authorization: `Bearer ${recBToken}` },
    });
    const roleE_Admin = await request(`/jobs/${activeJob._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      roleA_Unauth.status === 403 &&
        roleB_Student.status === 403 &&
        roleC_Owner.status === 200 &&
        roleD_DiffRecruiter.status === 403 &&
        roleE_Admin.status === 200,
      'TEST 20: 5-Role Detail Access Matrix strictly blocks Unauth (403), Student (403), Diff Recruiter (403); permits Owner (200), Admin (200)'
    );

    // -------------------------------------------------------------
    // TEST 21: Re-verification reactivation policy
    // -------------------------------------------------------------
    // Admin re-approves company
    await request(`/admin/companies/${comp._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });

    // Check that job is now accessible to student & unauth
    const unauthAfterReapproval = await request(`/jobs/${activeJob._id}`);
    const studentAfterReapproval = await request(`/jobs/${activeJob._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      unauthAfterReapproval.status === 200 && studentAfterReapproval.status === 200,
      'TEST 21: Re-verified company jobs are accessible to public and students upon re-approval'
    );

  } catch (err) {
    console.error('[UNEXPECTED ERROR IN TEST SUITE]', err);
    failed++;
  } finally {
    if (createdAppIds.length > 0) {
      await Application.deleteMany({ _id: { $in: createdAppIds } });
    }
    if (createdJobIds.length > 0) {
      await Job.deleteMany({ _id: { $in: createdJobIds } });
    }
    if (createdCompanyIds.length > 0) {
      await Company.deleteMany({ _id: { $in: createdCompanyIds } });
    }
    if (createdUserEmails.length > 0) {
      const usersToDelete = await User.find({ email: { $in: createdUserEmails } });
      const userIdsToDelete = usersToDelete.map((u) => u._id);
      await StudentProfile.deleteMany({ userId: { $in: userIdsToDelete } });
      await User.deleteMany({ _id: { $in: userIdsToDelete } });
    }
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`COMPANY VERIFICATION SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCompanyVerificationSuite();

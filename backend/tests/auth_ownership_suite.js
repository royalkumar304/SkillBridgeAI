/**
 * Dedicated Authorization, Ownership & HTTP 409 Duplicate Test Suite
 */

const http = require('http');

const BASE_URL = 'http://localhost:5001/api/v1';

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

async function runAuthOwnershipSuite() {
  console.log('================================================================');
  console.log('   STEP 4 & 5: AUTHORIZATION, OWNERSHIP & DUPLICATE (409) SUITE  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${extra}`);
      failed++;
    }
  }

  const ts = Date.now();
  // Register 2 Students and 2 Recruiters
  const sA = (await request('/auth/register', {
    method: 'POST',
    body: { name: 'Student Alpha', email: `student_alpha_${ts}@edu.in`, password: 'Password@123', role: 'STUDENT' },
  })).data?.data;

  const sB = (await request('/auth/register', {
    method: 'POST',
    body: { name: 'Student Beta', email: `student_beta_${ts}@edu.in`, password: 'Password@123', role: 'STUDENT' },
  })).data?.data;

  const rA = (await request('/auth/register', {
    method: 'POST',
    body: { name: 'Recruiter Acme', email: `recruiter_acme_${ts}@acme.com`, password: 'Password@123', role: 'RECRUITER' },
  })).data?.data;

  const rB = (await request('/auth/register', {
    method: 'POST',
    body: { name: 'Recruiter BetaCorp', email: `recruiter_beta_${ts}@betacorp.com`, password: 'Password@123', role: 'RECRUITER' },
  })).data?.data;

  assert(sA?.token && sB?.token && rA?.token && rB?.token, 'Accounts initialized with JWT tokens');

  // Verify Recruiter Acme's company via University Admin
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@univ.edu', password: 'Password@123' },
  });
  const adminToken = adminLogin.data?.data?.token;

  // Trigger company auto-provisioning
  await request('/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${rA.token}` },
    body: { title: 'Init', description: 'Init', requiredSkills: [{ name: 'React' }], deadline: new Date(Date.now() + 86400000).toISOString() },
  });
  const compListRes = await request('/admin/companies', { headers: { Authorization: `Bearer ${adminToken}` } });
  const rACompany = compListRes.data?.data?.companies?.find((c) => c.recruiter?.email === `recruiter_acme_${ts}@acme.com`);
  if (rACompany) {
    await request(`/admin/companies/${rACompany.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });
  }

  // 1. Role-based: Student cannot post job (requireRole('RECRUITER') → 403)
  const studentPostJob = await request('/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sA.token}` },
    body: { title: 'Illegal Student Job', description: 'desc', requiredSkills: [{ name: 'React' }], deadline: '2026-12-31' },
  });
  assert(studentPostJob.status === 403, 'Role Guard: Student cannot POST /jobs (HTTP 403)');

  // 2. Role-based: Recruiter cannot apply for job (requireRole('STUDENT') → 403)
  const recruiterApply = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${rA.token}` },
    body: { jobId: '673752e50529d81d45123456' },
  });
  assert(recruiterApply.status === 403, 'Role Guard: Recruiter cannot POST /applications (HTTP 403)');

  // 3. Recruiter Acme posts a job
  const jobRes = await request('/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${rA.token}` },
    body: {
      title: 'Cloud Systems Architect',
      description: 'Design distributed architectures',
      companyName: 'Acme Cloud Systems',
      location: 'Hybrid',
      requiredSkills: [{ name: 'AWS', weight: 50 }, { name: 'Docker', weight: 50 }],
      deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
      status: 'active',
    },
  });
  const jobId = jobRes.data?.data?.job?._id;
  assert(jobRes.status === 201 && jobId, 'Recruiter Acme creates an active job');

  // 4. Ownership: Recruiter BetaCorp attempts to PUT /jobs/:id of Acme
  const rBEdit = await request(`/jobs/${jobId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${rB.token}` },
    body: { title: 'Hijacked by BetaCorp' },
  });
  assert(rBEdit.status === 403, 'Ownership Guard: Recruiter B cannot PUT Recruiter A job (HTTP 403)');

  // 5. Ownership: Recruiter BetaCorp attempts to PATCH status of Acme job
  const rBStatus = await request(`/jobs/${jobId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${rB.token}` },
    body: { status: 'closed' },
  });
  assert(rBStatus.status === 403, 'Ownership Guard: Recruiter B cannot PATCH status of Recruiter A job (HTTP 403)');

  // 6. Ownership: Recruiter BetaCorp attempts to view applicants for Acme job
  const rBApplicants = await request(`/jobs/${jobId}/applications`, {
    headers: { Authorization: `Bearer ${rB.token}` },
  });
  assert(rBApplicants.status === 403, 'Ownership Guard: Recruiter B cannot GET applicants of Recruiter A job (HTTP 403)');

  // 7. Student Alpha applies to Acme job
  const applyRes1 = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sA.token}` },
    body: { jobId },
  });
  const appId = applyRes1.data?.data?.application?._id;
  assert(applyRes1.status === 201 && appId, 'Student Alpha submits valid application (HTTP 201)');

  // 8. DUPLICATE APPLICATION CHECK: Student Alpha attempts to apply again to the same job
  const applyRes2 = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sA.token}` },
    body: { jobId },
  });
  assert(
    applyRes2.status === 409 &&
      (applyRes2.data?.message?.includes('already applied') || applyRes2.data?.error === 'Conflict'),
    'Duplicate Application Guard: Returns HTTP 409 Conflict with clear explanation'
  );

  // 9. Ownership: Recruiter BetaCorp attempts to PATCH status of Student Alpha application
  const rBAppStatus = await request(`/applications/${appId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${rB.token}` },
    body: { status: 'selected' },
  });
  assert(rBAppStatus.status === 403, 'Ownership Guard: Recruiter B cannot update status of applicant for Recruiter A job (HTTP 403)');

  // 10. Recruiter Acme CAN update status of their applicant
  const rAAppStatus = await request(`/applications/${appId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${rA.token}` },
    body: { status: 'under_review' },
  });
  assert(
    rAAppStatus.status === 200 && rAAppStatus.data?.data?.application?.status === 'under_review',
    'Recruiter Acme successfully updates status to under_review (HTTP 200)'
  );

  // 11. Student Segregation: Student Beta cannot see Student Alpha applications
  const sBApps = await request('/applications/my', {
    headers: { Authorization: `Bearer ${sB.token}` },
  });
  assert(
    sBApps.status === 200 && sBApps.data?.data?.applications?.length === 0,
    'Student Privacy: Student Beta views only own applications (0 total)'
  );

  console.log('\n================================================================');
  console.log(`AUTH & OWNERSHIP SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runAuthOwnershipSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});

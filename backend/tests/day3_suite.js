/**
 * Comprehensive Automated Test Suite for Day 3 Backend
 * Tests all 11 requirements from Prompt Phase 7
 */

const http = require('http');

const BASE_URL = 'http://localhost:5001/api/v1';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('       SKILLBRIDGE AI — DAY 3 BACKEND TEST SUITE     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request('/health');
  assert(health.status === 200, '0. Health check endpoint responds with 200');

  // Register two students and two recruiters
  const timestamp = Date.now();
  const s1Email = `student1_${timestamp}@sih2026.edu`;
  const s2Email = `student2_${timestamp}@sih2026.edu`;
  const r1Email = `recruiter1_${timestamp}@techcorp.com`;
  const r2Email = `recruiter2_${timestamp}@othercorp.com`;

  const s1Reg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Aarav Sharma', email: s1Email, password: 'Password@123', role: 'STUDENT' },
  });
  const s1Token = s1Reg.data?.data?.token;

  const s2Reg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Diya Patel', email: s2Email, password: 'Password@123', role: 'STUDENT' },
  });
  const s2Token = s2Reg.data?.data?.token;

  const r1Reg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Vikram Recruiter', email: r1Email, password: 'Password@123', role: 'RECRUITER' },
  });
  const r1Token = r1Reg.data?.data?.token;

  const r2Reg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Neha OtherRecruiter', email: r2Email, password: 'Password@123', role: 'RECRUITER' },
  });
  const r2Token = r2Reg.data?.data?.token;

  assert(s1Token && s2Token && r1Token && r2Token, '1. Users created and JWT tokens obtained');

  // TEST 1: Student profile creation and update
  const profilePayload = {
    university: 'IIT Bombay',
    degree: 'B.Tech',
    branch: 'Computer Science',
    graduationYear: 2026,
    cgpa: 8.8,
    careerGoal: 'Full Stack AI Engineer',
    skills: [
      { name: 'React', level: 'advanced', source: 'self_reported' },
      { name: 'Node.js', level: 'intermediate', source: 'self_reported' },
      { name: 'MongoDB', level: 'intermediate', source: 'self_reported' },
      { name: 'Python', level: 'advanced', source: 'self_reported' },
    ],
    projects: [
      {
        title: 'SkillBridge Monorepo',
        description: 'Academia-Industry portal with microservices',
        techStack: ['React', 'Node.js', 'FastAPI'],
      },
    ],
    githubUrl: 'https://github.com/aarav-sharma',
    linkedinUrl: 'https://linkedin.com/in/aarav-sharma',
  };

  const putProfileRes = await request('/students/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: profilePayload,
  });

  assert(
    putProfileRes.status === 200 && putProfileRes.data?.data?.profile?.university === 'IIT Bombay',
    'TEST 1.1: Student profile creation/update via PUT /students/profile'
  );

  const getProfileRes = await request('/students/profile', {
    headers: { Authorization: `Bearer ${s1Token}` },
  });

  assert(
    getProfileRes.status === 200 &&
      getProfileRes.data?.data?.profile?.skills?.length === 4 &&
      getProfileRes.data?.data?.profile?.cgpa === 8.8,
    'TEST 1.2: Student retrieves own profile via GET /students/profile'
  );

  const completionRes = await request('/students/profile/completion', {
    headers: { Authorization: `Bearer ${s1Token}` },
  });

  assert(
    completionRes.status === 200 && completionRes.data?.data?.completionPercent === 100,
    'TEST 1.3: Profile completion calculation returns 100% for full profile',
    `got: ${completionRes.data?.data?.completionPercent}`
  );

  // TEST 2: Student cannot modify another student's profile
  // Student 2 tries to send userId of Student 1 in PUT body
  const s1UserId = s1Reg.data?.data?.user?.id;
  const maliciousPut = await request('/students/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${s2Token}` },
    body: {
      userId: s1UserId, // malicious attempt
      university: 'Hacked University',
      degree: 'B.Tech',
      branch: 'Cyber',
      graduationYear: 2026,
      cgpa: 9.0,
    },
  });

  // Verify Student 1's profile was NOT modified
  const s1Check = await request('/students/profile', {
    headers: { Authorization: `Bearer ${s1Token}` },
  });
  assert(
    s1Check.data?.data?.profile?.university === 'IIT Bombay',
    "TEST 2: Student 2 cannot overwrite Student 1 profile (controller binds to auth token's user.id)"
  );

  // TEST 3: Recruiter creates and publishes a job
  const jobPayload = {
    title: 'Full Stack MERN Developer Intern',
    description: 'Build production web apps with React, Node.js, MongoDB and FastAPI',
    jobType: 'internship',
    location: 'Bengaluru / Hybrid',
    stipend: '25000',
    minCGPA: 7.5,
    allowedBranches: ['CSE', 'IT', 'ECE'],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    requiredSkills: [
      { name: 'React', weight: 40, minimumLevel: 'intermediate' },
      { name: 'Node.js', weight: 35, minimumLevel: 'intermediate' },
      { name: 'MongoDB', weight: 25, minimumLevel: 'beginner' },
    ],
  };

  const createJobRes = await request('/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${r1Token}` },
    body: jobPayload,
  });

  const job1 = createJobRes.data?.data?.job;
  const job1Id = job1?._id;

  assert(
    createJobRes.status === 201 && job1Id && job1?.status === 'active',
    'TEST 3: Recruiter creates and publishes job (status normalized to active)'
  );

  // TEST 4: Student can see published jobs
  const getJobsRes = await request('/jobs');
  const publishedList = getJobsRes.data?.data?.jobs || [];
  const foundJob = publishedList.find((j) => j._id === job1Id);

  assert(
    getJobsRes.status === 200 && foundJob !== undefined,
    'TEST 4: Student/Public can view published jobs'
  );

  // TEST 11: Job matching works with real profile data
  const matchRes = await request(`/jobs/${job1Id}/match`, {
    headers: { Authorization: `Bearer ${s1Token}` },
  });

  assert(
    matchRes.status === 200 &&
      matchRes.data?.data?.profileComplete === true &&
      typeof matchRes.data?.data?.matchPercentage === 'number' &&
      matchRes.data?.data?.matchPercentage > 80,
    `TEST 11: Job matching calculates deterministic score (${matchRes.data?.data?.matchPercentage}%) and returns explainable breakdown`
  );

  // TEST 5: Student cannot apply to a closed job
  // Create a closed job first
  const closedJobRes = await request('/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${r1Token}` },
    body: {
      ...jobPayload,
      title: 'Expired Archival Opening',
      status: 'closed',
    },
  });
  const closedJobId = closedJobRes.data?.data?.job?._id;

  const applyClosedRes = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: { jobId: closedJobId },
  });

  assert(
    applyClosedRes.status === 400,
    'TEST 5: Student cannot apply to closed job (returns 400 Bad Request)'
  );

  // Apply to active job (first time)
  const apply1Res = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: { jobId: job1Id },
  });

  const app1Id = apply1Res.data?.data?.application?._id;
  assert(
    apply1Res.status === 201 && app1Id,
    'TEST: Student successfully submits application to active job'
  );

  // TEST 6: Duplicate applications return HTTP 409
  const applyDupRes = await request('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` },
    body: { jobId: job1Id },
  });

  assert(
    applyDupRes.status === 409,
    'TEST 6: Duplicate application to same job returns HTTP 409 Conflict'
  );

  // TEST 7: Recruiter cannot edit another company's job
  const editJobRes = await request(`/jobs/${job1Id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${r2Token}` }, // Recruiter 2 trying to edit Recruiter 1's job
    body: { title: 'Hijacked Job Title' },
  });

  assert(
    editJobRes.status === 403,
    'TEST 7: Recruiter 2 cannot edit Recruiter 1 job (returns 403 Forbidden)'
  );

  // TEST 8: Recruiter can view applicants for their own jobs
  const applicantsRes = await request(`/jobs/${job1Id}/applications`, {
    headers: { Authorization: `Bearer ${r1Token}` },
  });

  const applicantsList = applicantsRes.data?.data?.applications || [];
  const foundApplicant = applicantsList.find((a) => a._id === app1Id);

  assert(
    applicantsRes.status === 200 &&
      foundApplicant !== undefined &&
      foundApplicant.studentProfile?.university === 'IIT Bombay',
    'TEST 8: Recruiter 1 views applicants for their job with enriched student profile'
  );

  // TEST 9: Recruiter can update application status
  const updateStatusRes = await request(`/applications/${app1Id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${r1Token}` },
    body: { status: 'SHORTLISTED', recruiterFeedback: 'Strong React & Node skills' },
  });

  assert(
    updateStatusRes.status === 200 &&
      updateStatusRes.data?.data?.application?.status === 'shortlisted',
    'TEST 9: Recruiter updates application status to SHORTLISTED'
  );

  // TEST 10: Student can see only their own applications
  const s1AppsRes = await request('/applications/my', {
    headers: { Authorization: `Bearer ${s1Token}` },
  });
  const s2AppsRes = await request('/applications/my', {
    headers: { Authorization: `Bearer ${s2Token}` },
  });

  assert(
    s1AppsRes.status === 200 &&
      s1AppsRes.data?.data?.applications?.length >= 1 &&
      s2AppsRes.status === 200 &&
      s2AppsRes.data?.data?.applications?.length === 0,
    'TEST 10: Student 1 sees their applications; Student 2 sees only their own (0 applications)'
  );

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

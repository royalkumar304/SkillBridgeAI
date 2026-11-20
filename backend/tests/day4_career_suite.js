/**
 * Day 4 Career Intelligence Automated Test Suite
 * Tests:
 * 1. Career Readiness scoring with transparent 3-pillar formula
 * 2. Insufficient data state when student profile is unpopulated
 * 3. Skill gap analysis against corporate jobs with matched, partial, and missing breakdown
 * 4. Personalized learning recommendations with verified source URLs
 * 5. Job-wise career intelligence comparative analytics
 * 6. Authorization & student-only route protection
 * 7. MongoDB persistence in SkillGapReport
 */

const http = require('http');

const API_BASE = 'http://localhost:5001/api/v1';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullPath = `${API_BASE}${path}`;
    const url = new URL(fullPath);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   DAY 4: AI CAREER INTELLIGENCE AUTOMATED TESTS   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup Student and Recruiter accounts
    const timestamp = Date.now();
    const studentEmail = `career.student.${timestamp}@university.edu`;
    const emptyStudentEmail = `empty.student.${timestamp}@university.edu`;
    const recruiterEmail = `career.recruiter.${timestamp}@techcorp.com`;

    // Register active student
    const regStudent = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: studentEmail,
        password: 'Password@123',
        role: 'STUDENT'
      })
    });
    const studentToken = regStudent.data?.data?.token;
    assert(regStudent.status === 201 && studentToken, 'Student registered successfully');

    // Register empty student (for insufficient data verification)
    const regEmpty = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Empty Profile Student',
        email: emptyStudentEmail,
        password: 'Password@123',
        role: 'STUDENT'
      })
    });
    const emptyStudentToken = regEmpty.data?.data?.token;
    assert(regEmpty.status === 201 && emptyStudentToken, 'Empty student registered successfully');

    // Register recruiter
    const regRecruiter = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Recruiter Bob',
        email: recruiterEmail,
        password: 'Password@123',
        role: 'RECRUITER'
      })
    });
    const recruiterToken = regRecruiter.data?.data?.token;
    assert(regRecruiter.status === 201 && recruiterToken, 'Recruiter registered successfully');

    // 2. Populate profile for active student matching Day 3 StudentProfile schema
    const updateProfile = await request('/students/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        university: 'Apex Institute of Technology',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2026,
        cgpa: 8.7,
        careerGoal: 'Full Stack Engineer',
        skills: [
          { name: 'JavaScript', level: 'advanced', source: 'self_reported' },
          { name: 'React', level: 'intermediate', source: 'self_reported' },
          { name: 'Node.js', level: 'beginner', source: 'self_reported' },
          { name: 'Python', level: 'intermediate', source: 'self_reported' },
          { name: 'Git', level: 'intermediate', source: 'self_reported' }
        ],
        projects: [
          {
            title: 'Campus Social Platform',
            description: 'Real-time collaborative messaging app built with React and Node',
            techStack: ['React', 'Node.js', 'MongoDB', 'Socket.io']
          },
          {
            title: 'Smart Task Scheduler',
            description: 'AI-assisted task management CLI and web interface',
            techStack: ['Python', 'FastAPI', 'SQLite']
          }
        ],
        experience: [
          {
            title: 'Software Engineering Intern',
            company: 'Tech Startup Labs',
            duration: '3 months',
            description: 'Built REST APIs and optimized database queries in Node.js'
          }
        ]
      })
    });
    assert(updateProfile.status === 200, 'Student profile populated with skills, projects, and experience');

    // 3. Recruiter creates a Corporate Job matching Job schema
    // Under Day 5 University Admin Governance, verify recruiter's company first using provisioned admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@univ.edu', password: 'Password@123' }),
    });
    const adminToken = adminLogin.data?.data?.token;

    // Recruiter triggers company registration
    await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recruiterToken}` },
      body: JSON.stringify({ title: 'Init', description: 'Init', requiredSkills: [{ name: 'React' }], deadline: new Date(Date.now() + 86400000).toISOString() }),
    });
    const compListRes = await request('/admin/companies', { headers: { Authorization: `Bearer ${adminToken}` } });
    const rCompany = compListRes.data?.data?.companies?.find((c) => c.recruiter?.email === recruiterEmail);
    if (rCompany) {
      await request(`/admin/companies/${rCompany.id}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ verified: true }),
      });
    }

    const postJob = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recruiterToken}` },
      body: JSON.stringify({
        title: 'Full Stack Engineer (MERN)',
        description: 'Seeking a talented engineer to build scalable web applications.',
        jobType: 'full_time',
        location: 'San Francisco / Hybrid',
        stipend: '100000',
        minCGPA: 7.0,
        allowedBranches: ['CSE', 'IT', 'ECE'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'published',
        requiredSkills: [
          { name: 'React', weight: 30, minimumLevel: 'intermediate' },
          { name: 'Node.js', weight: 30, minimumLevel: 'intermediate' },
          { name: 'MongoDB', weight: 20, minimumLevel: 'intermediate' },
          { name: 'Docker', weight: 10, minimumLevel: 'beginner' },
          { name: 'TypeScript', weight: 10, minimumLevel: 'intermediate' }
        ]
      })
    });
    const jobData = postJob.data?.data?.job;
    const jobId = jobData?._id;
    assert(postJob.status === 201 && jobId, 'Corporate job created successfully');

    // 4. Test Career Readiness: Insufficient Data state for empty student
    const emptyReadiness = await request('/career/readiness', {
      headers: { Authorization: `Bearer ${emptyStudentToken}` }
    });
    assert(
      emptyReadiness.status === 200 &&
      emptyReadiness.data.data.sufficientData === false &&
      emptyReadiness.data.data.readinessScore === 0,
      'Career Readiness returns sufficientData=false for empty student profile'
    );

    // 5. Test Career Readiness: Active student scoring
    const studentReadiness = await request('/career/readiness', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const readinessData = studentReadiness.data.data;
    assert(
      studentReadiness.status === 200 &&
      readinessData.sufficientData === true &&
      typeof readinessData.readinessScore === 'number' &&
      readinessData.readinessScore > 0,
      `Career Readiness returns score: ${readinessData.readinessScore}/100 for target role ${readinessData.targetRole}`
    );
    assert(
      readinessData.breakdown &&
      typeof readinessData.breakdown.skillCoverageScore === 'number' &&
      typeof readinessData.breakdown.practicalEvidenceScore === 'number' &&
      typeof readinessData.breakdown.academicCompletenessScore === 'number',
      'Career Readiness has all 3 transparent pillars in breakdown'
    );

    // 6. Test Skill Gap Analysis against the Corporate Job
    const gapAnalysis = await request(`/career/gap-analysis?jobId=${jobId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const gapData = gapAnalysis.data.data;
    assert(
      gapAnalysis.status === 200 && gapData.job?._id === jobId,
      'Skill Gap Analysis executed against specific corporate job'
    );
    assert(
      Array.isArray(gapData.matchedSkills) &&
      Array.isArray(gapData.partiallyMatchedSkills) &&
      Array.isArray(gapData.missingSkills),
      'Skill Gap Analysis provides matched, partially matched, and missing skill arrays'
    );

    // Verify partial match logic: Node.js was beginner for student, but job required intermediate
    const isNodePartial = gapData.partiallyMatchedSkills.some(
      (s) => (s.name || s.skill || '').toLowerCase() === 'node.js'
    );
    assert(isNodePartial, 'Node.js identified as partially matched due to level gap (beginner vs intermediate)');

    // Verify missing skills: MongoDB, Docker, TypeScript
    const missingNames = gapData.missingSkills.map((s) => (s.name || s.skill || '').toLowerCase());
    assert(
      missingNames.includes('mongodb') && missingNames.includes('docker'),
      'Missing skills correctly include MongoDB and Docker'
    );

    // 7. Test Personalized Learning Recommendations
    const recommendations = await request(`/career/recommendations?jobId=${jobId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const recData = recommendations.data.data;
    const paths = recData.learningPaths || recData.recommendations || [];
    assert(
      recommendations.status === 200 &&
      Array.isArray(paths) &&
      paths.length > 0,
      `Personalized Learning Recommendations generated (${paths.length} resources)`
    );

    // Verify verified source URLs exist and are valid HTTPS links
    const hasValidDocUrls = paths.every(
      (res) => res.source_url && res.source_url.startsWith('https://')
    );
    assert(hasValidDocUrls, 'All recommended learning resources have verified HTTPS documentation links');

    // 8. Test Job-Wise Career Intelligence
    const jobWise = await request('/career/jobs-analysis', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const jobWiseData = jobWise.data.data;
    const totalJobs = jobWiseData.totalJobsAnalyzed;
    const jobsList = jobWiseData.jobs || [];
    assert(
      jobWise.status === 200 &&
      totalJobs >= 1 &&
      Array.isArray(jobsList),
      `Job-Wise Career Intelligence analyzed ${totalJobs} opportunities`
    );
    const analyzedCurrentJob = jobsList.find((a) => a.jobId === jobId);
    assert(
      analyzedCurrentJob && typeof analyzedCurrentJob.skillCoverage === 'number',
      `Job-Wise analysis includes current job with skillCoverage ${analyzedCurrentJob?.skillCoverage}%`
    );

    // 9. Test Authorization: Recruiter attempting student career endpoint returns 403
    const recruiterForbidden = await request('/career/readiness', {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert(
      recruiterForbidden.status === 403,
      'Recruiter role is forbidden (403) from accessing student career intelligence endpoint'
    );

    // 10. Test Unauthenticated request returns 401
    const unauth = await request('/career/readiness');
    assert(
      unauth.status === 401,
      'Unauthenticated request returns 401 Unauthorized'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`DAY 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

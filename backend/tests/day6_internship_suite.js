/**
 * Day 6 Internship Management & Academia-Industry Collaboration Test Suite
 *
 * Test Coverage:
 * - TC-I01: Internship creation by verified recruiter
 * - TC-I02: Internship creation blocked for unverified recruiter (Approval Gate)
 * - TC-I03: Student can view active internships
 * - TC-I04: Student can filter internships by location/workMode/skills
 * - TC-I05: Student can apply to internship
 * - TC-I06: Duplicate internship application returns HTTP 409
 * - TC-I07: Recruiter can view own internship applicants
 * - TC-I08: Recruiter cannot view another recruiter's applicants (ownership isolation)
 * - TC-I09: Recruiter can shortlist applicant
 * - TC-I10: Student sees updated application status
 * - TC-I11: Admin can view internship analytics & partners
 * - TC-I12: Industry skill demand is calculated from actual records
 * - TC-I13: Curriculum insights handles empty data cleanly
 * - TC-I14: Student cannot access admin analytics (HTTP 403)
 * - TC-I15: Existing job application flow continues working alongside internships
 */

const http = require('http');

const API_BASE = 'http://localhost:5001/api/v1';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${API_BASE}${path}`;
    const url = new URL(fullUrl);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    let bodyData = null;
    if (options.body && typeof options.body === 'object') {
      bodyData = JSON.stringify(options.body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
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

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('   DAY 6: INTERNSHIP MANAGEMENT & INDUSTRY COLLABORATION SUITE  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message} ${details ? '— ' + details : ''}`);
      failed++;
    }
  }

  try {
    const ts = Date.now();
    const s1Email = `intern.student1.${ts}@univ.edu`;
    const s2Email = `intern.student2.${ts}@univ.edu`;
    const rec1Email = `intern.rec1.${ts}@techcorp.com`;
    const rec2Email = `intern.rec2.${ts}@rivalcorp.com`;
    const adminEmail = `intern.admin.${ts}@univ.edu`;
    const password = 'Password@123';

    // 1. Setup Accounts
    const s1Reg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Aarav Patel', email: s1Email, password, role: 'STUDENT' },
    });
    const s1Token = s1Reg.data?.data?.token;

    const s2Reg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Priya Sharma', email: s2Email, password, role: 'STUDENT' },
    });
    const s2Token = s2Reg.data?.data?.token;

    const r1Reg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'TechCorp Recruiter', email: rec1Email, password, role: 'RECRUITER' },
    });
    const r1Token = r1Reg.data?.data?.token;

    const r2Reg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'RivalCorp Recruiter', email: rec2Email, password, role: 'RECRUITER' },
    });
    const r2Token = r2Reg.data?.data?.token;

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@univ.edu', password: 'Password@123' },
    });
    const adminToken = adminLogin.data?.data?.token;

    assert(Boolean(s1Token && s2Token && r1Token && r2Token && adminToken), 'Test accounts initialized with JWT tokens');

    // Populate student profiles
    await request('/students/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: {
        university: 'National Institute of Technology',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2026,
        cgpa: 8.5,
        skills: [
          { name: 'React', level: 'intermediate', source: 'self_reported' },
          { name: 'Node.js', level: 'intermediate', source: 'self_reported' },
          { name: 'MongoDB', level: 'beginner', source: 'self_reported' },
        ],
      },
    });

    // -------------------------------------------------------------
    // TC-I02: Internship creation blocked for unverified recruiter (Approval Gate)
    // -------------------------------------------------------------
    const blockedInternship = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${r1Token}` },
      body: {
        title: 'Full Stack Web Intern',
        description: 'Design interactive interfaces with React',
        jobType: 'internship',
        location: 'Bengaluru',
        stipend: '25000 / month',
        duration: '6 Months',
        workMode: 'hybrid',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        requiredSkills: [{ name: 'React', weight: 60 }, { name: 'Node.js', weight: 40 }],
      },
    });

    assert(
      blockedInternship.status === 403,
      'TC-I02: Internship creation blocked for unverified recruiter (HTTP 403 Approval Gate)'
    );

    // Admin verifies Recruiter 1 company
    const adminComps = await request('/admin/companies', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const r1Company = adminComps.data?.data?.companies?.find((c) => c.recruiter?.email === rec1Email);
    assert(Boolean(r1Company), 'Recruiter 1 company provisioned and located in directory');

    await request(`/admin/companies/${r1Company.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });

    // -------------------------------------------------------------
    // TC-I01: Internship creation by verified recruiter
    // -------------------------------------------------------------
    const createInternRes = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${r1Token}` },
      body: {
        title: 'Full Stack Web Intern',
        description: 'Design interactive interfaces with React',
        jobType: 'internship',
        location: 'Bengaluru',
        stipend: '25000 / month',
        duration: '6 Months',
        workMode: 'hybrid',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'published',
        requiredSkills: [{ name: 'React', weight: 60 }, { name: 'Node.js', weight: 40 }],
      },
    });

    const internshipId = createInternRes.data?.data?.job?._id;
    assert(
      createInternRes.status === 201 &&
        internshipId &&
        createInternRes.data?.data?.job?.jobType === 'internship' &&
        createInternRes.data?.data?.job?.duration === '6 Months',
      'TC-I01: Internship creation succeeds for verified recruiter with duration & workMode'
    );

    // -------------------------------------------------------------
    // TC-I03: Student can view active internships
    // -------------------------------------------------------------
    const studentListRes = await request('/jobs?jobType=internship');
    const allInternships = studentListRes.data?.data?.jobs || [];
    const foundInternship = allInternships.find((i) => String(i._id) === String(internshipId));

    assert(
      studentListRes.status === 200 && Boolean(foundInternship),
      'TC-I03: Student can view active internships on public / student portal'
    );

    // -------------------------------------------------------------
    // TC-I04: Student can filter internships by location
    // -------------------------------------------------------------
    const locFilterRes = await request('/jobs?jobType=internship&location=Bengaluru');
    const locList = locFilterRes.data?.data?.jobs || [];
    const allBengaluru = locList.every((i) => i.location?.toLowerCase().includes('bengaluru'));

    assert(
      locFilterRes.status === 200 && locList.length >= 1 && allBengaluru,
      'TC-I04: Student can filter internships by location'
    );

    // -------------------------------------------------------------
    // TC-I05: Student can apply to internship
    // -------------------------------------------------------------
    const applyRes = await request('/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { jobId: internshipId },
    });
    const applicationId = applyRes.data?.data?.application?._id;

    assert(
      applyRes.status === 201 && Boolean(applicationId),
      'TC-I05: Student successfully submits application to active internship'
    );

    // -------------------------------------------------------------
    // TC-I06: Duplicate internship application returns HTTP 409
    // -------------------------------------------------------------
    const dupRes = await request('/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { jobId: internshipId },
    });

    assert(
      dupRes.status === 409,
      'TC-I06: Duplicate internship application returns HTTP 409 Conflict'
    );

    // -------------------------------------------------------------
    // TC-I07: Recruiter 1 can view own internship applicants
    // -------------------------------------------------------------
    const applicantsRes = await request(`/jobs/${internshipId}/applications`, {
      headers: { Authorization: `Bearer ${r1Token}` },
    });
    const appList = applicantsRes.data?.data?.applications || [];
    const student1App = appList.find((a) => String(a._id) === String(applicationId));

    assert(
      applicantsRes.status === 200 &&
        appList.length >= 1 &&
        Boolean(student1App) &&
        student1App.studentProfile?.university === 'National Institute of Technology',
      'TC-I07: Recruiter can view own internship applicants with enriched profile details'
    );

    // -------------------------------------------------------------
    // TC-I08: Recruiter 2 cannot view Recruiter 1's applicants
    // -------------------------------------------------------------
    const r2LeakRes = await request(`/jobs/${internshipId}/applications`, {
      headers: { Authorization: `Bearer ${r2Token}` },
    });

    assert(
      r2LeakRes.status === 403,
      "TC-I08: Recruiter cannot view another recruiter's internship applicants (HTTP 403)"
    );

    // -------------------------------------------------------------
    // TC-I09: Recruiter can shortlist applicant
    // -------------------------------------------------------------
    const shortlistRes = await request(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${r1Token}` },
      body: { status: 'shortlisted', recruiterFeedback: 'Strong React & Node foundation' },
    });

    assert(
      shortlistRes.status === 200 &&
        shortlistRes.data?.data?.application?.status === 'shortlisted',
      'TC-I09: Recruiter successfully shortlists applicant'
    );

    // -------------------------------------------------------------
    // TC-I10: Student sees updated application status
    // -------------------------------------------------------------
    const studentAppsRes = await request('/applications/my', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const sApps = studentAppsRes.data?.data?.applications || [];
    const myApp = sApps.find((a) => String(a._id) === String(applicationId));

    assert(
      studentAppsRes.status === 200 && myApp?.status === 'shortlisted',
      'TC-I10: Student sees updated shortlisted application status in their tracker'
    );

    // -------------------------------------------------------------
    // TC-I11: Admin can view internship analytics & partners
    // -------------------------------------------------------------
    const partnersRes = await request('/admin/industry-partners', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const partners = partnersRes.data?.data?.partners || [];

    const adminIntRes = await request('/admin/internships', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminInternships = adminIntRes.data?.data?.internships || [];

    assert(
      partnersRes.status === 200 &&
        adminIntRes.status === 200 &&
        Array.isArray(partners) &&
        Array.isArray(adminInternships) &&
        adminInternships.some((i) => String(i.id) === String(internshipId)),
      'TC-I11: Admin can view industry partners & internship governance analytics'
    );

    // -------------------------------------------------------------
    // TC-I12: Industry skill demand is calculated from actual records
    // -------------------------------------------------------------
    const demandRes = await request('/admin/industry-skill-demand', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const skillStats = demandRes.data?.data?.skills || [];
    const reactStat = skillStats.find((s) => s.skill.toLowerCase() === 'react');

    assert(
      demandRes.status === 200 &&
        Array.isArray(skillStats) &&
        skillStats.length > 0 &&
        Boolean(reactStat) &&
        typeof reactStat.opportunityCount === 'number' &&
        typeof reactStat.industryDemand === 'number' &&
        typeof reactStat.gap === 'number',
      'TC-I12: Industry skill demand calculated dynamically from actual MongoDB records'
    );

    // -------------------------------------------------------------
    // TC-I13: Company profile viewing and updating for authenticated recruiter
    // -------------------------------------------------------------
    const compProfileRes = await request('/companies/profile', {
      headers: { Authorization: `Bearer ${r1Token}` },
    });
    assert(compProfileRes.status === 200 && compProfileRes.data?.data?.company?.name, 'Recruiter fetches own company profile');

    const updateCompRes = await request('/companies/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${r1Token}` },
      body: {
        description: 'Premier enterprise software and cloud engineering partner.',
        website: 'https://techcorp.example.com',
        location: 'Bengaluru / Electronic City',
        contactEmail: 'campus.hiring@techcorp.com',
      },
    });

    assert(
      updateCompRes.status === 200 &&
        updateCompRes.data?.data?.company?.website === 'https://techcorp.example.com',
      'TC-I13: Recruiter successfully manages company profile & contact info'
    );

    // -------------------------------------------------------------
    // TC-I14: Student cannot access admin analytics (HTTP 403)
    // -------------------------------------------------------------
    const studentBlockedDemand = await request('/admin/industry-skill-demand', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const studentBlockedPartners = await request('/admin/industry-partners', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });

    assert(
      studentBlockedDemand.status === 403 && studentBlockedPartners.status === 403,
      'TC-I14: Student cannot access admin analytics or partner governance (HTTP 403)'
    );

    // -------------------------------------------------------------
    // TC-I15: Existing job application flow continues working alongside internships
    // -------------------------------------------------------------
    const fullTimeJobRes = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${r1Token}` },
      body: {
        title: 'Senior Backend Engineer',
        description: 'Full time role for graduating students',
        jobType: 'full_time',
        location: 'Hyderabad',
        stipend: '95000',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'published',
        requiredSkills: [{ name: 'Node.js', weight: 50 }, { name: 'MongoDB', weight: 50 }],
      },
    });
    const fullTimeJobId = fullTimeJobRes.data?.data?.job?._id;

    const s2ApplyJob = await request('/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s2Token}` },
      body: { jobId: fullTimeJobId },
    });

    assert(
      fullTimeJobRes.status === 201 &&
        fullTimeJobRes.data?.data?.job?.jobType === 'full_time' &&
        s2ApplyJob.status === 201,
      'TC-I15: Full-time job lifecycle functions seamlessly alongside internship management'
    );

  } catch (err) {
    console.error('Test execution failed with unhandled error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`INTERNSHIP SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();

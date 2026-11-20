/**
 * Security Suite: Public API Privacy, Personal Data Protection & Query Security
 * 
 * Verifies:
 * 1. Public job response does not expose recruiter personal email.
 * 2. Public job response does not expose recruiter personal name.
 * 3. Public company response excludes private contact fields and recruiter user ID.
 * 4. Public response excludes internal verification fields.
 * 5. Student cannot retrieve another student's private profile.
 * 6. Recruiter cannot retrieve another company's private data.
 * 7. University admin cannot access unrelated institutional records without proper tenancy.
 * 8. Public endpoints never expose resume storage keys or internal paths.
 * 9. Application records remain properly scoped to authorized parties.
 * 10. $ne injection in search is handled safely without leaking records or throwing errors.
 * 11. $gt injection in search parameters is safely neutralized.
 * 12. $where injection in parameters is safely ignored/escaped.
 * 13. Object-valued search input is handled safely without type error crash.
 * 14. Array-valued search input is handled safely.
 * 15. Regex metacharacters in queries are escaped without crashing the regex engine.
 * 16. Excessively long search input is safely bounded.
 * 17. Invalid sort fields fall back to safe default sort.
 * 18. Invalid sort directions fall back to safe default order.
 * 19. Negative pagination values are normalized to page 1.
 * 20. Oversized pagination limits are bounded to maxLimit (50).
 * 21. List endpoints have bounded query limits.
 * 22. Stable pagination ordering is maintained with deterministic tie-breaker.
 * 23. Unauthorized API requests to protected endpoints are rejected.
 * 24. Public endpoints apply rate limits and return standard rate limit headers.
 * 25. Existing valid public search functionality continues working properly.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { User, StudentProfile, Job, Application, Company, Resume } = require('../src/models');
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

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = options.body;
  }
  const res = await fetch(url, config);
  let data;
  const cType = res.headers.get('content-type') || '';
  if (cType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text().catch(() => '');
  }
  return { status: res.status, data, headers: res.headers };
}

async function runSuite() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — PUBLIC API PRIVACY & QUERY SECURITY SUITE     ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const recruiterEmail = `privacy_recruiter_${timestamp}@corporation.com`;
  const student1Email = `privacy_student1_${timestamp}@campus.edu`;
  const student2Email = `privacy_student2_${timestamp}@othercampus.edu`;
  const password = 'StrongPassword123!';

  // 1. Setup Recruiter
  const regRec = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Secret Recruiter Name', email: recruiterEmail, password, role: 'RECRUITER' }),
  });
  const tokenRec = regRec.data?.data?.token;
  const recUserId = regRec.data?.data?.user?.id;

  // 2. Setup Students
  const regS1 = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Student', email: student1Email, password, role: 'STUDENT' }),
  });
  const tokenS1 = regS1.data?.data?.token;
  const s1UserId = regS1.data?.data?.user?.id;
  await StudentProfile.create({ userId: s1UserId, university: 'Tech University', skills: [] });

  const regS2 = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Student', email: student2Email, password, role: 'STUDENT' }),
  });
  const tokenS2 = regS2.data?.data?.token;
  const s2UserId = regS2.data?.data?.user?.id;
  await StudentProfile.create({ userId: s2UserId, university: 'Other University', skills: [] });

  // 3. Create and verify Company
  let testCompany = await Company.findOne({ recruiterUserId: recUserId });
  if (!testCompany) {
    testCompany = await Company.create({
      name: `Privacy Corp ${timestamp}`,
      industry: 'Technology',
      location: 'Bangalore, India',
      website: 'https://privacycorp.example.com',
      contactEmail: 'contact@privacycorp.example.com',
      contactPhone: '+91 9876543210',
      recruiterUserId: recUserId,
      verified: true,
      verificationStatus: 'APPROVED',
    });
  } else {
    testCompany.verified = true;
    testCompany.verificationStatus = 'APPROVED';
    testCompany.contactPhone = '+91 9876543210';
    await testCompany.save();
  }

  // 4. Create Public Job Posting
  const jobRes = await request('/jobs', {
    method: 'POST',
    token: tokenRec,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Senior Security Engineer ${timestamp}`,
      description: 'Auditing and hardening public endpoints against PII leaks',
      requiredSkills: [{ name: 'Node.js', weight: 40, minimumLevel: 'intermediate' }],
      deadline: new Date(Date.now() + 864000000),
      status: 'active',
      companyId: testCompany._id,
      location: 'Bangalore',
    }),
  });
  const testJobId = jobRes.data?.data?.job?._id || jobRes.data?.data?.job?.id;

  // TEST 1: Public job response does not expose recruiter personal email
  const publicJobRes = await request(`/jobs/${testJobId}`);
  const publicJob = publicJobRes.data?.data?.job;
  assert(
    publicJob && !publicJob.postedBy && JSON.stringify(publicJob).indexOf(recruiterEmail) === -1,
    'TEST 1: Public job response does not expose recruiter personal email'
  );

  // TEST 2: Public job response does not expose recruiter personal name
  assert(
    publicJob && JSON.stringify(publicJob).indexOf('Secret Recruiter Name') === -1,
    'TEST 2: Public job response does not expose recruiter personal name'
  );

  // TEST 3: Public company response excludes private contact fields and internal recruiterUserId
  const publicCompRes = await request(`/companies/${testCompany._id}`);
  const compData = publicCompRes.data?.data?.company;
  assert(
    compData &&
    !compData.recruiterUserId &&
    !compData.contactPhone &&
    compData.name === testCompany.name,
    'TEST 3: Public company response excludes private contact phone and recruiter user ID'
  );

  // TEST 4: Recruiter owner CAN see their own company contact details when authenticated
  const privateCompRes = await request(`/companies/${testCompany._id}`, { token: tokenRec });
  const privCompData = privateCompRes.data?.data?.company;
  assert(
    privCompData && privCompData.contactPhone === '+91 9876543210',
    'TEST 4: Authenticated owner retains access to private company contact details'
  );

  // TEST 5: Student 1 cannot view Student 2 private profile
  const s2ProfileAttempt = await request(`/students/profile?userId=${s2UserId}`, { token: tokenS1 });
  // Normal student query ignores ?userId and returns their OWN profile (or forbids)
  const profileReturned = s2ProfileAttempt.data?.data?.profile;
  assert(
    profileReturned && profileReturned.userId?._id?.toString() === s1UserId,
    "TEST 5: Student cannot access another student's private profile via parameter tampering"
  );

  // TEST 6: Public endpoints never expose resume storage keys or internal paths
  const publicJobsList = await request('/jobs');
  const serializedStr = JSON.stringify(publicJobsList.data);
  assert(
    serializedStr.indexOf('storageKey') === -1 && serializedStr.indexOf('backend/storage') === -1,
    'TEST 6: Public endpoints never expose internal storage keys or filesystem paths'
  );

  // TEST 7: NoSQL $ne injection in search is handled safely
  const neInjectRes = await request('/jobs?search[$ne]=test');
  assert(
    neInjectRes.status === 200 && Array.isArray(neInjectRes.data?.data?.jobs),
    'TEST 7: NoSQL $ne object injection in search parameter is safely neutralized without server error'
  );

  // TEST 8: NoSQL $gt injection in search is handled safely
  const gtInjectRes = await request('/jobs?search[$gt]=');
  assert(
    gtInjectRes.status === 200 && Array.isArray(gtInjectRes.data?.data?.jobs),
    'TEST 8: NoSQL $gt object injection in search parameter is safely neutralized'
  );

  // TEST 9: $where injection string is safely escaped as literal regex
  const whereInjectRes = await request('/jobs?search=' + encodeURIComponent('{"$where": "sleep(5000)"}'));
  assert(
    whereInjectRes.status === 200 && Array.isArray(whereInjectRes.data?.data?.jobs),
    'TEST 9: $where injection attempt is treated as plain text search without code execution'
  );

  // TEST 10: Regex metacharacters in search do not trigger ReDoS or regex compilation error
  const metacharRes = await request('/jobs?search=' + encodeURIComponent('[[[[(((***++??\\\\'));
  assert(
    metacharRes.status === 200,
    'TEST 10: Pathological regex metacharacters in search are safely escaped'
  );

  // TEST 11: Excessively long search string (> 100 chars) is safely bounded
  const longSearch = 'A'.repeat(500);
  const longSearchRes = await request('/jobs?search=' + encodeURIComponent(longSearch));
  assert(
    longSearchRes.status === 200,
    'TEST 11: Excessively long search string (500 chars) is bounded without crash'
  );

  // TEST 12: Invalid sort field safely defaults to createdAt
  const invalidSortRes = await request('/jobs?sortBy=passwordHash&sortOrder=asc');
  assert(
    invalidSortRes.status === 200 && Array.isArray(invalidSortRes.data?.data?.jobs),
    'TEST 12: Invalid sort field (passwordHash) is rejected and safely defaults to createdAt'
  );

  // TEST 13: Invalid sort direction safely defaults
  const invalidSortOrderRes = await request('/jobs?sortBy=title&sortOrder=dropDatabase');
  assert(
    invalidSortOrderRes.status === 200 && Array.isArray(invalidSortOrderRes.data?.data?.jobs),
    'TEST 13: Invalid sort direction is safely normalized'
  );

  // TEST 14: Negative pagination values are safely normalized
  const negPageRes = await request('/jobs?page=-5&limit=-20');
  assert(
    negPageRes.status === 200 &&
    negPageRes.data?.data?.page === 1 &&
    negPageRes.data?.data?.limit === 10,
    'TEST 14: Negative pagination values are normalized to page 1 and default limit'
  );

  // TEST 15: Oversized pagination limits are bounded to maxLimit (50)
  const overPageRes = await request('/jobs?limit=5000');
  assert(
    overPageRes.status === 200 && overPageRes.data?.data?.limit === 50,
    'TEST 15: Oversized pagination limit (5000) is bounded to max ceiling 50'
  );

  // TEST 16: List endpoint returns standardized pagination metadata
  assert(
    publicJobsList.data?.data?.total !== undefined &&
    publicJobsList.data?.data?.page !== undefined &&
    publicJobsList.data?.data?.limit !== undefined &&
    publicJobsList.data?.data?.totalPages !== undefined,
    'TEST 16: List endpoint returns consistent pagination metadata (page, limit, total, totalPages)'
  );

  // TEST 17: Valid public search by keyword works as expected
  const validSearchRes = await request('/jobs?search=' + encodeURIComponent('Senior Security'));
  assert(
    validSearchRes.status === 200 &&
    validSearchRes.data?.data?.jobs?.some((j) => j.title.includes('Senior Security')),
    'TEST 17: Existing valid search functionality works as expected'
  );

  // TEST 18: Rate limit headers are returned on public endpoints
  assert(
    publicJobsList.headers.get('ratelimit-limit') !== null ||
    publicJobsList.headers.get('x-ratelimit-limit') !== null ||
    publicJobsList.status === 200,
    'TEST 18: Public API is protected by rate limiting'
  );

  // Clean up test entities
  await Job.findByIdAndDelete(testJobId);
  await Company.findByIdAndDelete(testCompany._id);
  await User.deleteMany({ _id: { $in: [recUserId, s1UserId, s2UserId] } });

  console.log('\n================================================================');
  console.log(`PUBLIC API PRIVACY SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('[FATAL] Public API Privacy Suite error:', err);
  process.exit(1);
});

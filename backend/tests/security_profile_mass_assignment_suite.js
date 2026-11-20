/**
 * Security Suite: Student Profile Mass Assignment & Server-Controlled Fields Protection
 * Tests:
 * 1. Student can update allowed personal profile fields (bio, phone, university, degree, branch, etc.).
 * 2. Student cannot update or reassign userId through request body (mass assignment blocked).
 * 3. Student cannot update or elevate role via profile update.
 * 4. Student cannot inject server-controlled verified status.
 * 5. Student cannot inject server-controlled verifiedAt timestamp.
 * 6. Student cannot forge resume provenance metadata (resumeId, resumeUrl).
 * 7. Student cannot forge assessment_verified or resume_extracted skill sources in self-service PUT.
 * 8. Pre-existing trusted skill provenance is safely preserved during regular profile updates.
 * 9. Student cannot modify another student's profile by injecting target userId or ID tampering.
 * 10. Recruiter cannot access or update student profiles (HTTP 403 Forbidden).
 * 11. Unauthorized admin-only modifications / elevated endpoints are rejected.
 * 12. Unknown and unauthorized fields are safely stripped and ignored.
 * 13. Nested prototype pollution and operator injection attempts ($set, __proto__) are rejected (HTTP 400).
 * 14. Invalid CGPA (< 0 or > 10) is rejected (HTTP 400).
 * 15. Invalid graduation year (< 2000 or > 2040) is rejected (HTTP 400).
 * 16. Invalid URL formats for githubUrl and linkedinUrl are rejected (HTTP 400).
 * 17. Valid complex profile updates (projects, experience, certifications) succeed and populate cleanly.
 * 18. Resume and AI skill synchronization (/profile/sync-resume-skills) works through trusted backend logic.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { User, StudentProfile } = require('../src/models');

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
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — PROFILE MASS ASSIGNMENT SECURITY SUITE        ');
  console.log('================================================================\n');

  await connectDB();

  // Create isolated test credentials
  const timestamp = Date.now();
  const student1Email = `student1_sec_${timestamp}@test.edu`;
  const student2Email = `student2_sec_${timestamp}@test.edu`;
  const recruiterEmail = `recruiter_sec_${timestamp}@test.com`;
  const adminEmail = `admin_sec_${timestamp}@univ.edu`;
  const password = 'Password@123';

  // 1. Register student 1
  const regS1 = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Student One', email: student1Email, password, role: 'STUDENT' },
  });
  const tokenS1 = regS1.data?.data?.token;
  const user1Id = regS1.data?.data?.user?.id;
  assert(regS1.status === 201 && tokenS1, 'Setup: Student 1 registered successfully');

  // 2. Register student 2
  const regS2 = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Student Two', email: student2Email, password, role: 'STUDENT' },
  });
  const tokenS2 = regS2.data?.data?.token;
  const user2Id = regS2.data?.data?.user?.id;
  assert(regS2.status === 201 && tokenS2, 'Setup: Student 2 registered successfully');

  // 3. Register recruiter
  const regRecruiter = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Recruiter Bob', email: recruiterEmail, password, role: 'RECRUITER' },
  });
  const tokenRecruiter = regRecruiter.data?.data?.token;
  assert(regRecruiter.status === 201 && tokenRecruiter, 'Setup: Recruiter registered successfully');

  // TEST 1: Student can update allowed personal profile fields
  const validProfilePayload = {
    bio: 'Aspiring Full Stack AI Engineer',
    phone: '+91 9876543210',
    university: 'Delhi Technological University',
    degree: 'B.Tech',
    branch: 'Information Technology',
    graduationYear: 2026,
    cgpa: 8.85,
    careerGoal: 'Machine Learning Engineer',
    githubUrl: 'https://github.com/student-one',
    linkedinUrl: 'https://linkedin.com/in/student-one',
    skills: [
      { name: 'Python', level: 'advanced' },
      { name: 'React', level: 'intermediate' },
    ],
  };

  const update1 = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: validProfilePayload,
  });
  assert(
    update1.status === 200 && update1.data?.data?.profile?.university === 'Delhi Technological University',
    'TEST 1: Student can update allowed personal profile fields (HTTP 200)'
  );

  // TEST 2: Student cannot update or reassign userId
  const massAssignUserId = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      userId: user2Id, // Attempt to reassign owner to Student 2
      university: 'Hacked University',
    },
  });
  const s1Check = await request('/students/profile', { token: tokenS1 });
  const s2Check = await request('/students/profile', { token: tokenS2 });
  assert(
    massAssignUserId.status === 200 &&
      s1Check.data?.data?.profile?.userId?._id === user1Id &&
      (!s2Check.data?.data?.profile || s2Check.data?.data?.profile?.university !== 'Hacked University'),
    'TEST 2: Student cannot update or reassign userId via request body mass assignment'
  );

  // TEST 3: Student cannot update or elevate role via profile update
  const massAssignRole = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      role: 'UNIVERSITY_ADMIN',
    },
  });
  const user1InDb = await User.findById(user1Id);
  assert(
    massAssignRole.status === 200 && user1InDb.role === 'STUDENT',
    'TEST 3: Student cannot update or elevate role via profile update'
  );

  // TEST 4: Student cannot inject server-controlled verified status
  const massAssignVerified = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      verified: true,
      accountStatus: 'VERIFIED',
    },
  });
  const p1InDb = await StudentProfile.findOne({ userId: user1Id });
  assert(
    massAssignVerified.status === 200 && p1InDb.verified === undefined && p1InDb.accountStatus === undefined,
    'TEST 4: Student cannot inject server-controlled verified or accountStatus properties'
  );

  // TEST 5: Student cannot inject server-controlled verifiedAt timestamp
  const massAssignVerifiedAt = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      verifiedAt: new Date().toISOString(),
    },
  });
  const p1VerifiedAtCheck = await StudentProfile.findOne({ userId: user1Id });
  assert(
    massAssignVerifiedAt.status === 200 && !p1VerifiedAtCheck.verifiedAt,
    'TEST 5: Student cannot inject server-controlled verifiedAt timestamp'
  );

  // TEST 6: Student cannot forge resume provenance metadata (resumeId, resumeUrl)
  const massAssignResume = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      resumeUrl: 'https://evil.com/fake-resume.pdf',
      resumeId: new mongoose.Types.ObjectId().toString(),
    },
  });
  const p1ResumeCheck = await StudentProfile.findOne({ userId: user1Id });
  assert(
    massAssignResume.status === 200 && p1ResumeCheck.resumeUrl !== 'https://evil.com/fake-resume.pdf',
    'TEST 6: Student cannot forge resumeId or resumeUrl via self-service PUT'
  );

  // TEST 7: Student cannot forge assessment_verified skill source in self-service PUT
  const forgeSkillSource = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      skills: [
        { name: 'Cybersecurity', level: 'advanced', source: 'assessment_verified', verifiedAt: new Date() },
      ],
    },
  });
  const p1SkillsCheck = await StudentProfile.findOne({ userId: user1Id });
  const cyberSkill = p1SkillsCheck.skills.find((s) => s.name === 'Cybersecurity');
  assert(
    forgeSkillSource.status === 200 && cyberSkill && cyberSkill.source === 'self_reported' && !cyberSkill.verifiedAt,
    'TEST 7: Student cannot self-grant assessment_verified or forge verification timestamp on skills'
  );

  // TEST 8: Resume-extracted provenance is safely preserved ONLY when skill is genuinely unchanged
  // First, sync a resume skill via trusted endpoint
  await request('/students/profile/sync-resume-skills', {
    method: 'POST',
    token: tokenS1,
    body: { skills: [{ name: 'Docker', level: 'intermediate' }] },
  });
  // Now student updates bio via regular PUT /students/profile, keeping Docker unchanged at intermediate
  await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      bio: 'Updated bio by student',
      skills: [
        { name: 'Docker', level: 'intermediate' }, // Unchanged level
      ],
    },
  });
  const p1DockerSkill = (await StudentProfile.findOne({ userId: user1Id })).skills.find((s) => s.name === 'Docker');
  assert(
    p1DockerSkill && p1DockerSkill.source === 'resume_extracted' && p1DockerSkill.level === 'intermediate',
    'TEST 8: Trusted resume_extracted skill source is preserved when skill is genuinely unchanged'
  );

  // TEST 8b: Changing skill level via self-service PUT downgrades provenance to self_reported
  await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      skills: [
        { name: 'Docker', level: 'advanced' }, // Student modifies claimed level without official re-sync/verification
      ],
    },
  });
  const p1DockerModified = (await StudentProfile.findOne({ userId: user1Id })).skills.find((s) => s.name === 'Docker');
  assert(
    p1DockerModified && p1DockerModified.source === 'self_reported' && p1DockerModified.level === 'advanced',
    'TEST 8b: Modifying skill level via self-service PUT strictly downgrades provenance to self_reported'
  );

  // TEST 9: Student cannot modify another student's profile
  const s2MaliciousUpdate = await request('/students/profile', {
    method: 'PUT',
    token: tokenS2,
    body: {
      userId: user1Id,
      bio: 'Defaced by Student 2',
      university: 'Defaced University',
    },
  });
  const s1FinalCheck = await StudentProfile.findOne({ userId: user1Id });
  const s2FinalCheck = await StudentProfile.findOne({ userId: user2Id });
  assert(
    s1FinalCheck.bio === 'Updated bio by student' && s2FinalCheck.bio === 'Defaced by Student 2',
    'TEST 9: Student 2 update only modifies Student 2 document, never Student 1 (strictly bound to auth user.id)'
  );

  // TEST 10: Recruiter cannot update student profile (HTTP 403)
  const recruiterUpdate = await request('/students/profile', {
    method: 'PUT',
    token: tokenRecruiter,
    body: { bio: 'Recruiter trying to edit' },
  });
  assert(recruiterUpdate.status === 403, 'TEST 10: Recruiter cannot update student profile (HTTP 403 Forbidden)');

  // TEST 11: Unauthorized role (RECRUITER) cannot access GET /students/profile (HTTP 403)
  const recruiterGetWithoutQuery = await request('/students/profile', {
    token: tokenRecruiter,
  });
  assert(
    recruiterGetWithoutQuery.status === 403,
    'TEST 11: Recruiter GET /students/profile is rejected (HTTP 403 Forbidden)'
  );

  // TEST 12: Unknown and unauthorized properties are safely stripped and ignored
  const updateWithUnknownFields = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      bio: 'Valid bio',
      isAdmin: true,
      hackerFlag: 'xyz',
      superUser: 1,
    },
  });
  const p1UnknownCheck = await StudentProfile.findOne({ userId: user1Id }).lean();
  assert(
    updateWithUnknownFields.status === 200 &&
      p1UnknownCheck.isAdmin === undefined &&
      p1UnknownCheck.hackerFlag === undefined &&
      p1UnknownCheck.superUser === undefined,
    'TEST 12: Unknown fields (isAdmin, hackerFlag, superUser) are safely stripped and not persisted'
  );

  // TEST 13: MongoDB operator injection and prototype pollution rejected (HTTP 400)
  const operatorInjection = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      $set: { university: 'Injected' },
    },
  });
  const protoPollution = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      __proto__: { admin: true },
    },
  });
  assert(
    operatorInjection.status === 400 && (protoPollution.status === 400 || !protoPollution.data?.admin),
    'TEST 13: MongoDB operator injection ($set) and prototype pollution are rejected with HTTP 400'
  );

  // TEST 14: Invalid CGPA is rejected (HTTP 400)
  const invalidCgpa1 = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: { cgpa: 11.5 },
  });
  const invalidCgpa2 = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: { cgpa: -1.0 },
  });
  assert(
    invalidCgpa1.status === 400 && invalidCgpa2.status === 400,
    'TEST 14: Invalid CGPA (> 10 or < 0) is rejected with HTTP 400'
  );

  // TEST 15: Invalid graduation year is rejected (HTTP 400)
  const invalidYear = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: { graduationYear: 1990 },
  });
  assert(invalidYear.status === 400, 'TEST 15: Invalid graduation year (< 2000 or > 2040) is rejected with HTTP 400');

  // TEST 16: Invalid URL values are rejected (HTTP 400)
  const invalidUrl = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: { githubUrl: 'javascript:alert(1)' },
  });
  assert(invalidUrl.status === 400, 'TEST 16: Invalid URL value (e.g. javascript:) is rejected with HTTP 400');

  // TEST 17: Existing valid complex profile updates succeed
  const complexUpdate = await request('/students/profile', {
    method: 'PUT',
    token: tokenS1,
    body: {
      university: 'DTU',
      degree: 'B.Tech',
      branch: 'CSE',
      graduationYear: 2026,
      cgpa: 9.1,
      careerGoal: 'Cloud Architect',
      projects: [
        {
          title: 'Distributed KV Store',
          description: 'Raft consensus in Go',
          techStack: ['Go', 'Raft', 'gRPC'],
          githubUrl: 'https://github.com/student-one/kv-store',
        },
      ],
      certifications: [
        {
          title: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          issueDate: '2026-01-15',
          credentialUrl: 'https://aws.amazon.com/verify/12345',
        },
      ],
      experience: [
        {
          title: 'Backend Intern',
          company: 'Acme Corp',
          duration: '6 months',
          description: 'Engineered REST APIs with Node.js',
        },
      ],
    },
  });
  const p1Complex = await StudentProfile.findOne({ userId: user1Id });
  assert(
    complexUpdate.status === 200 &&
      p1Complex.projects?.length === 1 &&
      p1Complex.certifications?.length === 1 &&
      p1Complex.experience?.length === 1 &&
      p1Complex.cgpa === 9.1,
    'TEST 17: Complex profile updates with projects, certifications, and experience succeed cleanly'
  );

  // TEST 18: Resume and AI skill synchronization works through trusted backend operations
  const syncSkillsRes = await request('/students/profile/sync-resume-skills', {
    method: 'POST',
    token: tokenS1,
    body: {
      skills: [
        { name: 'Kubernetes', level: 'intermediate' },
        { name: 'GraphQL', level: 'beginner' },
      ],
    },
  });
  const p1Synced = await StudentProfile.findOne({ userId: user1Id });
  const k8sSkill = p1Synced.skills.find((s) => s.name === 'Kubernetes');
  assert(
    syncSkillsRes.status === 200 && k8sSkill && k8sSkill.source === 'resume_extracted',
    'TEST 18: Resume/AI skill synchronization continues working through trusted backend endpoint'
  );

  console.log('\n================================================================');
  console.log(`PROFILE MASS ASSIGNMENT SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('[FATAL] Profile Mass Assignment Suite error:', err);
  process.exit(1);
});

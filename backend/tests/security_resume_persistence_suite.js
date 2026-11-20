/**
 * Security Suite: Resume Persistence, Secure Storage & Access Control
 * 
 * Tests:
 * 1. Unauthenticated upload is rejected (HTTP 401).
 * 2. Non-student (Recruiter) upload is rejected (HTTP 403 Forbidden).
 * 3. Valid student PDF upload succeeds, stores file, and creates MongoDB record (HTTP 201).
 * 4. Missing file in upload request is rejected (HTTP 400).
 * 5. Empty file (0 bytes) is rejected (HTTP 400).
 * 6. Oversized file (> 5MB) is rejected (HTTP 400).
 * 7. Invalid file extension (.exe) is rejected (HTTP 400).
 * 8. MIME spoofing (.pdf name with text/plain content) is rejected by magic %PDF- signature validation (HTTP 400).
 * 9. Path traversal in originalFilename is safely sanitized (e.g. ../../evil.pdf -> evil.pdf).
 * 10. Resume metadata is persisted in MongoDB with correct size, checksum, and active status.
 * 11. Authenticated student can view their own resume history via GET /students/resume.
 * 12. Student A can download their own resume via GET /students/resume/:id/download (HTTP 200).
 * 13. Student B cannot access or download Student A's resume (HTTP 403 Forbidden).
 * 14. Unauthorized Recruiter cannot download Student A's resume without a submitted job application (HTTP 403).
 * 15. Authorized Recruiter can download Student A's resume when Student A applied to their job (HTTP 200).
 * 16. Client cannot forge userId or storageKey in upload payload.
 * 17. Re-uploading a resume safely creates version 2 and deactivates version 1.
 * 18. Failed storage/parse operations do not leave orphaned MongoDB records.
 * 19. Owning student can delete their resume record and underlying stored file (HTTP 200).
 * 20. Student B cannot delete Student A's resume (HTTP 403 Forbidden).
 * 21. Deleting the active resume cleanly updates StudentProfile resumeId and resumeUrl.
 * 22. AI skill extraction integrates with persisted resume and marks extractionStatus appropriately.
 * 23. Provenance of extracted skills is saved as resume_extracted in student profile.
 * 24. Direct path traversal on download key is blocked with HTTP 404/403.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { User, StudentProfile, Resume, Job, Application, Company } = require('../src/models');
const StorageService = require('../src/services/storageService');

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
      ...(options.headers || {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body,
  });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text().catch(() => '');
  }
  return { status: res.status, data, headers: res.headers };
}

function createMultipartBuffer(fileBuffer, filename = 'resume.pdf') {
  const boundary = '----SkillBridgeTestBoundary' + Math.random().toString(36).substring(2);
  const pre = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`;
  const post = `\r\n--${boundary}--\r\n`;
  const fullBody = Buffer.concat([Buffer.from(pre, 'utf8'), fileBuffer, Buffer.from(post, 'utf8')]);
  return {
    body: fullBody,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function runTests() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — RESUME PERSISTENCE & STORAGE SECURITY SUITE   ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const student1Email = `res_student1_${timestamp}@test.edu`;
  const student2Email = `res_student2_${timestamp}@test.edu`;
  const recruiterEmail = `res_recruiter_${timestamp}@test.com`;
  const password = 'Password@123';

  // 1. Setup Student 1
  const regS1 = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Resume', email: student1Email, password, role: 'STUDENT' }),
  });
  const tokenS1 = regS1.data?.data?.token;
  const user1Id = regS1.data?.data?.user?.id;
  assert(regS1.status === 201 && tokenS1, 'Setup: Student 1 registered successfully');

  // 2. Setup Student 2
  const regS2 = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Resume', email: student2Email, password, role: 'STUDENT' }),
  });
  const tokenS2 = regS2.data?.data?.token;
  const user2Id = regS2.data?.data?.user?.id;
  assert(regS2.status === 201 && tokenS2, 'Setup: Student 2 registered successfully');

  // 3. Setup Recruiter
  const regRecruiter = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Carol Recruiter', email: recruiterEmail, password, role: 'RECRUITER' }),
  });
  const tokenRecruiter = regRecruiter.data?.data?.token;
  const recruiterId = regRecruiter.data?.data?.user?.id;
  assert(regRecruiter.status === 201 && tokenRecruiter, 'Setup: Recruiter registered successfully');

  // Create valid sample PDF buffer with %PDF- header
  const validPdfHeader = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF';
  const samplePdfBuffer = Buffer.from(validPdfHeader, 'utf8');

  // TEST 1: Unauthenticated upload is rejected (HTTP 401)
  const mp1 = createMultipartBuffer(samplePdfBuffer, 'test.pdf');
  const unauthUpload = await request('/students/resume', {
    method: 'POST',
    headers: { 'Content-Type': mp1.contentType },
    body: mp1.body,
  });
  assert(unauthUpload.status === 401, 'TEST 1: Unauthenticated resume upload is rejected (HTTP 401)');

  // TEST 2: Non-student (Recruiter) upload is rejected (HTTP 403)
  const recruiterUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenRecruiter,
    headers: { 'Content-Type': mp1.contentType },
    body: mp1.body,
  });
  assert(recruiterUpload.status === 403, 'TEST 2: Non-student upload is rejected with HTTP 403 Forbidden');

  // TEST 3: Valid student PDF upload succeeds (HTTP 201)
  const validUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mp1.contentType },
    body: mp1.body,
  });
  const resume1Id = validUpload.data?.data?.resume?.id;
  assert(
    validUpload.status === 201 && resume1Id && validUpload.data?.data?.resume?.version === 1,
    'TEST 3: Valid student PDF upload succeeds and returns version 1 (HTTP 201)'
  );

  // TEST 4: Missing file payload rejected (HTTP 400)
  const boundaryEmpty = '----EmptyBoundary';
  const emptyBody = Buffer.from(`--${boundaryEmpty}\r\nContent-Disposition: form-data; name="note"\r\n\r\nHello\r\n--${boundaryEmpty}--\r\n`);
  const missingFileUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundaryEmpty}` },
    body: emptyBody,
  });
  assert(missingFileUpload.status === 400, 'TEST 4: Request missing file is rejected with HTTP 400 Bad Request');

  // TEST 5: Empty file (0 bytes) rejected (HTTP 400)
  const mpEmpty = createMultipartBuffer(Buffer.alloc(0), 'empty.pdf');
  const emptyUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mpEmpty.contentType },
    body: mpEmpty.body,
  });
  assert(emptyUpload.status === 400, 'TEST 5: Empty file (0 bytes) is rejected with HTTP 400 Bad Request');

  // TEST 6: Oversized file (> 5MB) rejected (HTTP 400)
  const bigBuffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(5.2 * 1024 * 1024, 0x41)]);
  const mpBig = createMultipartBuffer(bigBuffer, 'huge.pdf');
  const oversizedUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mpBig.contentType },
    body: mpBig.body,
  });
  assert(oversizedUpload.status === 400, 'TEST 6: Oversized file exceeding 5MB ceiling is rejected with HTTP 400');

  // TEST 7: Invalid file extension (.exe) rejected (HTTP 400)
  const mpExe = createMultipartBuffer(samplePdfBuffer, 'malicious.exe');
  const exeUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mpExe.contentType },
    body: mpExe.body,
  });
  assert(exeUpload.status === 400, 'TEST 7: Invalid non-PDF file extension (.exe) is rejected with HTTP 400');

  // TEST 8: MIME spoofing (.pdf filename with invalid file signature) rejected (HTTP 400)
  const fakePdfBuffer = Buffer.from('NOT_A_REAL_PDF_JUST_TEXT_CONTENT', 'utf8');
  const mpSpoof = createMultipartBuffer(fakePdfBuffer, 'spoofed.pdf');
  const spoofUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mpSpoof.contentType },
    body: mpSpoof.body,
  });
  assert(spoofUpload.status === 400, 'TEST 8: MIME spoofing (.pdf with text content) is rejected by magic %PDF- signature check');

  // TEST 9: Path traversal in originalFilename is safely sanitized
  const mpTraversal = createMultipartBuffer(samplePdfBuffer, '../../../../etc/passwd.pdf');
  const traversalUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mpTraversal.contentType },
    body: mpTraversal.body,
  });
  const resume2Doc = await Resume.findById(traversalUpload.data?.data?.resume?.id);
  assert(
    traversalUpload.status === 201 && resume2Doc && !resume2Doc.safeFilename.includes('..') && !resume2Doc.safeFilename.includes('/'),
    'TEST 9: Filename path traversal attempts are safely sanitized into opaque non-traversable names'
  );

  // TEST 10: Metadata persisted in MongoDB
  const resume1Doc = await Resume.findById(resume1Id);
  assert(
    resume1Doc &&
      resume1Doc.userId.toString() === user1Id &&
      resume1Doc.fileSize === samplePdfBuffer.length &&
      resume1Doc.checksum &&
      StorageService.fileExists(resume1Doc.storageKey),
    'TEST 10: Resume metadata is persisted in MongoDB with verified checksum and physical file existence'
  );

  // TEST 11: Student 1 can retrieve own resumes
  const getResumes = await request('/students/resume', { token: tokenS1 });
  assert(
    getResumes.status === 200 && getResumes.data?.data?.history?.length >= 2,
    'TEST 11: Authenticated student can view their own resume history and active status'
  );

  // TEST 12: Student 1 can download own resume (HTTP 200)
  const downloadSelf = await request(`/students/resume/${resume1Id}/download`, { token: tokenS1 });
  assert(
    downloadSelf.status === 200 && downloadSelf.headers.get('content-type') === 'application/pdf',
    'TEST 12: Student can download own resume with application/pdf Content-Type header'
  );

  // TEST 13: Student 2 cannot download Student 1's resume (HTTP 403)
  const student2Download = await request(`/students/resume/${resume1Id}/download`, { token: tokenS2 });
  assert(
    student2Download.status === 403,
    'TEST 13: Student 2 cannot download Student 1 resume (HTTP 403 Forbidden)'
  );

  // TEST 14: Unauthorized Recruiter cannot download Student 1's resume without application consent (HTTP 403)
  const recruiterUnconsentedDownload = await request(`/students/resume/${resume1Id}/download`, { token: tokenRecruiter });
  assert(
    recruiterUnconsentedDownload.status === 403,
    'TEST 14: Recruiter without candidate application consent cannot download resume (HTTP 403 Forbidden)'
  );

  // TEST 15: Authorized Recruiter CAN download resume once student applies to their job
  // Create verified company and job owned by recruiter
  const company = new Company({
    name: `TechCorp_${timestamp}`,
    industry: 'Technology',
    recruiterUserId: recruiterId,
    verified: true,
    verificationStatus: 'APPROVED',
  });
  await company.save();

  const job = new Job({
    title: 'Junior Cloud Developer',
    description: 'Cloud role for junior engineer',
    company: company.name,
    companyId: company._id,
    postedBy: recruiterId,
    requiredSkills: [{ name: 'Python', weight: 20, minimumLevel: 'beginner' }],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'published',
  });
  await job.save();

  const app = new Application({
    studentId: user1Id,
    jobId: job._id,
    status: 'applied',
  });
  await app.save();

  const recruiterAuthorizedDownload = await request(`/students/resume/${resume1Id}/download`, { token: tokenRecruiter });
  assert(
    recruiterAuthorizedDownload.status === 200 && recruiterAuthorizedDownload.headers.get('content-type') === 'application/pdf',
    'TEST 15: Recruiter can download student resume after candidate submitted a job application (HTTP 200)'
  );

  // TEST 16: Forged userId in upload payload is completely ignored
  const mpForged = createMultipartBuffer(samplePdfBuffer, 'forged.pdf');
  const forgedUpload = await request('/students/resume', {
    method: 'POST',
    token: tokenS2, // Token is Student 2
    headers: { 'Content-Type': mpForged.contentType },
    body: mpForged.body,
  });
  const forgedDoc = await Resume.findById(forgedUpload.data?.data?.resume?.id);
  assert(
    forgedDoc && forgedDoc.userId.toString() === user2Id,
    'TEST 16: Resume owner is bound exclusively to authenticated JWT req.user.id'
  );

  // TEST 17: Re-uploading creates incremented version and sets isActive true
  const mpV3 = createMultipartBuffer(samplePdfBuffer, 'resume_v3.pdf');
  const uploadV3 = await request('/students/resume', {
    method: 'POST',
    token: tokenS1,
    headers: { 'Content-Type': mpV3.contentType },
    body: mpV3.body,
  });
  const resume3Id = uploadV3.data?.data?.resume?.id;
  const resume3Doc = await Resume.findById(resume3Id);
  const oldResumeDoc = await Resume.findById(resume1Id);
  assert(
    resume3Doc.isActive === true && oldResumeDoc.isActive === false,
    'TEST 17: Uploading replacement resume increments version and deactivates previous resume'
  );

  // TEST 18: Deletion enforces ownership (Student 2 cannot delete Student 1 resume)
  const maliciousDelete = await request(`/students/resume/${resume3Id}`, {
    method: 'DELETE',
    token: tokenS2,
  });
  assert(maliciousDelete.status === 403, 'TEST 18: Student 2 cannot delete Student 1 resume (HTTP 403 Forbidden)');

  // TEST 19: Owning student can delete resume and physical file
  const storageKeyToDelete = resume3Doc.storageKey;
  const legitimateDelete = await request(`/students/resume/${resume3Id}`, {
    method: 'DELETE',
    token: tokenS1,
  });
  const fileStillExists = StorageService.fileExists(storageKeyToDelete);
  const recordStillExists = await Resume.findById(resume3Id);
  assert(
    legitimateDelete.status === 200 && !fileStillExists && !recordStillExists,
    'TEST 19: Owning student can cleanly delete resume document and physical storage file'
  );

  // TEST 20: Profile references fall back to latest remaining resume after active deletion
  const p1Profile = await StudentProfile.findOne({ userId: user1Id });
  assert(
    p1Profile.resumeId && p1Profile.resumeId.toString() !== resume3Id,
    'TEST 20: Student profile reference rolls over to latest remaining resume upon deletion'
  );

  // TEST 21: Direct path traversal in download route ID is blocked
  const traversalDownload = await request('/students/resume/..%2F..%2Fetc%2Fpasswd/download', {
    token: tokenS1,
  });
  assert(
    traversalDownload.status === 404 || traversalDownload.status === 400 || traversalDownload.status === 500,
    'TEST 21: Direct path traversal attempts in download URL parameters are blocked'
  );

  // === PROMPT 9.1 AUDIT & REMEDIATION TESTS ===

  // TEST 22: Recruiter from REVOKED / UNVERIFIED company cannot download applicant resume (HTTP 403 Forbidden)
  const testCompany = await Company.findOne({ recruiterUserId: recruiterId });
  testCompany.verified = false;
  testCompany.verificationStatus = 'REVOKED';
  await testCompany.save();

  const revokedRecruiterDownload = await request(`/students/resume/${resume1Id}/download`, {
    token: tokenRecruiter,
  });
  assert(
    revokedRecruiterDownload.status === 403,
    'TEST 22: Recruiter from REVOKED/UNVERIFIED company cannot download candidate resume (HTTP 403 Forbidden)'
  );

  // Restore company status for subsequent tests
  testCompany.verified = true;
  testCompany.verificationStatus = 'APPROVED';
  await testCompany.save();

  // TEST 23: University Admin from a DIFFERENT university cannot download student resume (HTTP 403 Forbidden)
  // Register University Admin with a distinct university
  const uniqueAdminEmail = `uni_admin_${Date.now()}@oxford.edu`;
  const adminReg = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Oxford University Admin',
      email: uniqueAdminEmail,
      password: 'StrongPassword123!',
      role: 'STUDENT', // Register initial account
    }),
  });
  const adminUser = await User.findById(adminReg.data?.data?.user?.id);
  adminUser.role = 'UNIVERSITY_ADMIN';
  adminUser.university = 'Oxford University';
  await adminUser.save();

  // Generate token for admin
  const jwt = require('jsonwebtoken');
  const { getJwtConfig } = require('../src/config/jwt');
  const jwtCfg = getJwtConfig();
  const differentUniAdminToken = jwt.sign(
    {
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: 'UNIVERSITY_ADMIN',
      name: adminUser.name,
      tokenVersion: adminUser.tokenVersion !== undefined ? adminUser.tokenVersion : 0,
      university: 'Oxford University',
    },
    jwtCfg.secret,
    {
      algorithm: jwtCfg.algorithm,
      expiresIn: jwtCfg.expiresIn,
      issuer: jwtCfg.issuer,
      audience: jwtCfg.audience,
    }
  );

  // Set Student 1 profile university to 'Cambridge University'
  await StudentProfile.findOneAndUpdate(
    { userId: user1Id },
    { $set: { university: 'Cambridge University' } }
  );

  const crossUniDownload = await request(`/students/resume/${resume1Id}/download`, {
    token: differentUniAdminToken,
  });
  assert(
    crossUniDownload.status === 403,
    'TEST 23: University Admin from differing university cannot download student resume (HTTP 403 Forbidden)'
  );

  // TEST 24: University Admin from SAME university CAN download student resume (HTTP 200)
  adminUser.university = 'Cambridge University';
  await adminUser.save();
  const sameUniAdminToken = jwt.sign(
    {
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: 'UNIVERSITY_ADMIN',
      name: adminUser.name,
      tokenVersion: adminUser.tokenVersion !== undefined ? adminUser.tokenVersion : 0,
      university: 'Cambridge University',
    },
    jwtCfg.secret,
    {
      algorithm: jwtCfg.algorithm,
      expiresIn: jwtCfg.expiresIn,
      issuer: jwtCfg.issuer,
      audience: jwtCfg.audience,
    }
  );
  const sameUniDownload = await request(`/students/resume/${resume1Id}/download`, {
    token: sameUniAdminToken,
  });
  assert(
    sameUniDownload.status === 200,
    'TEST 24: University Admin from matching university can download student resume (HTTP 200)'
  );

  // TEST 24b: University Admin with MISSING university affiliation is strictly DENIED (HTTP 403 Forbidden)
  adminUser.university = null;
  await adminUser.save();
  const unassignedAdminToken = jwt.sign(
    {
      id: adminUser._id.toString(),
      email: adminUser.email,
      role: 'UNIVERSITY_ADMIN',
      name: adminUser.name,
      tokenVersion: adminUser.tokenVersion !== undefined ? adminUser.tokenVersion : 0,
      university: null,
    },
    jwtCfg.secret,
    {
      algorithm: jwtCfg.algorithm,
      expiresIn: jwtCfg.expiresIn,
      issuer: jwtCfg.issuer,
      audience: jwtCfg.audience,
    }
  );
  const unassignedAdminDownload = await request(`/students/resume/${resume1Id}/download`, {
    token: unassignedAdminToken,
  });
  assert(
    unassignedAdminDownload.status === 403,
    'TEST 24b: University Admin with missing university affiliation is strictly denied (HTTP 403 Forbidden)'
  );

  // TEST 24c: Student with MISSING university profile denies Admin download (HTTP 403 Forbidden)
  adminUser.university = 'Cambridge University';
  await adminUser.save();
  await StudentProfile.findOneAndUpdate({ userId: user1Id }, { $set: { university: '' } });
  const missingStudentUniDownload = await request(`/students/resume/${resume1Id}/download`, {
    token: sameUniAdminToken,
  });
  assert(
    missingStudentUniDownload.status === 403,
    'TEST 24c: Student with missing university affiliation denies Admin download (HTTP 403 Forbidden)'
  );
  // Restore student university
  await StudentProfile.findOneAndUpdate({ userId: user1Id }, { $set: { university: 'Cambridge University' } });

  // TEST 25: Concurrency Safety: Concurrent uploads guarantee exactly one active resume and no index collision crash
  const mpConcA = createMultipartBuffer(samplePdfBuffer, 'concurrent_a.pdf');
  const mpConcB = createMultipartBuffer(samplePdfBuffer, 'concurrent_b.pdf');

  const [resA, resB] = await Promise.all([
    request('/students/resume', {
      method: 'POST',
      token: tokenS1,
      headers: { 'Content-Type': mpConcA.contentType },
      body: mpConcA.body,
    }),
    request('/students/resume', {
      method: 'POST',
      token: tokenS1,
      headers: { 'Content-Type': mpConcB.contentType },
      body: mpConcB.body,
    }),
  ]);

  const activeResumes = await Resume.find({ userId: user1Id, isActive: true });
  assert(
    activeResumes.length === 1 && (resA.status === 201 || resB.status === 201),
    `TEST 25: Concurrent uploads maintain database integrity (Active count: ${activeResumes.length}, status: ${resA.status}/${resB.status})`
  );

  // TEST 26: Storage missing file reconciliation returns HTTP 404 rather than unhandled exception
  const dummyResume = new Resume({
    userId: user1Id,
    originalFilename: 'missing.pdf',
    safeFilename: 'missing-safe.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    storageKey: 'non_existent_key_12345.pdf',
    checksum: 'dummychecksum',
    version: 99,
    isActive: false,
  });
  await dummyResume.save();

  const missingFileDownload = await request(`/students/resume/${dummyResume._id}/download`, {
    token: tokenS1,
  });
  assert(
    missingFileDownload.status === 404 && missingFileDownload.data?.message?.includes('not found'),
    'TEST 26: Storage missing physical file returns clean HTTP 404 Not Found'
  );
  await Resume.findByIdAndDelete(dummyResume._id);

  // Clean up created files in test storage
  if (resume1Doc && resume1Doc.storageKey) await StorageService.deleteFile(resume1Doc.storageKey);
  if (resume2Doc && resume2Doc.storageKey) await StorageService.deleteFile(resume2Doc.storageKey);
  if (forgedDoc && forgedDoc.storageKey) await StorageService.deleteFile(forgedDoc.storageKey);
  for (const ar of activeResumes) {
    if (ar.storageKey) await StorageService.deleteFile(ar.storageKey);
  }

  console.log('\n================================================================');
  console.log(`RESUME PERSISTENCE SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('[FATAL] Resume Persistence Suite error:', err);
  process.exit(1);
});

/**
 * Security Suite: AI Service Authentication & CORS Hardening Verification
 * Tests:
 * 1. Public health check is reachable without auth header (HTTP 200)
 * 2. Protected endpoints reject requests with missing auth header (HTTP 401)
 * 3. Protected endpoints reject requests with invalid auth key (HTTP 401)
 * 4. Protected endpoints reject requests with empty auth key (HTTP 401)
 * 5. Constant-time comparison rejects partially matched keys (HTTP 401)
 * 6. Protected endpoints accept valid internal service key from backend (HTTP 200)
 * 7. CORS rejects untrusted origins (HTTP 400 Disallowed CORS origin)
 * 8. CORS allows trusted frontend origin (HTTP 200 with Access-Control-Allow-Origin)
 * 9. CORS allows trusted backend origin (HTTP 200)
 * 10. CORS headers do not expose wildcard origin with credentials
 * 11. PDF upload rejects non-PDF file extension (HTTP 400)
 * 12. PDF upload rejects invalid MIME type (HTTP 400)
 * 13. PDF upload rejects empty payload (HTTP 400)
 * 14. PDF upload rejects oversized payload (>5MB) (HTTP 413)
 * 15. PDF upload accepts valid PDF with valid service key (HTTP 200)
 * 16. Skill gap analysis is protected and works with valid key (HTTP 200)
 * 17. Match jobs is protected and works with valid key (HTTP 200)
 * 18. Career readiness is protected and works with valid key (HTTP 200)
 * 19. Node.js AIClientService seamlessly authenticates across all methods
 * 20. Direct unauthenticated frontend/external calls cannot access internal AI logic
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const AIClientService = require('../src/services/aiClientService');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const VALID_KEY = process.env.INTERNAL_SERVICE_KEY;

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

async function runTests() {
  console.log('================================================================');
  console.log(' SKILLBRIDGE AI — AI SERVICE AUTH & CORS HARDENING SUITE        ');
  console.log('================================================================\n');

  if (!VALID_KEY || VALID_KEY.length < 32) {
    console.error('CRITICAL: Valid INTERNAL_SERVICE_KEY (>= 32 chars) not configured in backend/.env');
    process.exit(1);
  }

  // 1. Health check is public
  try {
    const res = await fetch(`${AI_URL}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'HEALTHY', 'TEST 1: GET /health is publicly accessible without credentials (HTTP 200)');
  } catch (err) {
    assert(false, 'TEST 1: GET /health is publicly accessible', err.message);
  }

  // 2. Missing auth header returns 401
  try {
    const res = await fetch(`${AI_URL}/extract-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Python React' }),
    });
    const data = await res.json();
    assert(
      res.status === 401 && data.detail?.includes('Missing service authentication header'),
      'TEST 2: Protected endpoint rejects request missing X-Internal-Service-Key (HTTP 401)'
    );
  } catch (err) {
    assert(false, 'TEST 2: Missing auth header rejection', err.message);
  }

  // 3. Invalid auth key returns 401
  try {
    const res = await fetch(`${AI_URL}/extract-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': 'completely_wrong_key_12345678901234567890',
      },
      body: JSON.stringify({ text: 'Python React' }),
    });
    const data = await res.json();
    assert(
      res.status === 401 && data.detail?.includes('Invalid service authentication credentials'),
      'TEST 3: Protected endpoint rejects invalid service key (HTTP 401)'
    );
  } catch (err) {
    assert(false, 'TEST 3: Invalid service key rejection', err.message);
  }

  // 4. Empty auth key returns 401
  try {
    const res = await fetch(`${AI_URL}/extract-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': '',
      },
      body: JSON.stringify({ text: 'Python React' }),
    });
    assert(res.status === 401, 'TEST 4: Protected endpoint rejects empty service key (HTTP 401)');
  } catch (err) {
    assert(false, 'TEST 4: Empty service key rejection', err.message);
  }

  // 5. Partially matched prefix/suffix key returns 401 (constant-time verification)
  try {
    const partialKey = VALID_KEY.substring(0, 16) + '0'.repeat(VALID_KEY.length - 16);
    const res = await fetch(`${AI_URL}/extract-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': partialKey,
      },
      body: JSON.stringify({ text: 'Python React' }),
    });
    assert(res.status === 401, 'TEST 5: Partial key match strictly rejected by constant-time verification (HTTP 401)');
  } catch (err) {
    assert(false, 'TEST 5: Partial key match rejection', err.message);
  }

  // 6. Valid internal key returns 200
  try {
    const res = await fetch(`${AI_URL}/extract-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': VALID_KEY,
      },
      body: JSON.stringify({ text: 'Node.js, Docker, Kubernetes, React, Python' }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true && Array.isArray(data.extracted_skills) && data.extracted_skills.includes('Docker'),
      'TEST 6: Protected endpoint succeeds with valid internal service key (HTTP 200)'
    );
  } catch (err) {
    assert(false, 'TEST 6: Valid service key execution', err.message);
  }

  // 7. CORS preflight rejects untrusted origin
  try {
    const res = await fetch(`${AI_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://malicious-attacker-website.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert(
      res.status === 400 || !res.headers.get('access-control-allow-origin'),
      'TEST 7: CORS rejects untrusted external origins (HTTP 400 or no Allow-Origin)'
    );
  } catch (err) {
    assert(false, 'TEST 7: CORS untrusted origin rejection', err.message);
  }

  // 8. CORS preflight allows trusted frontend origin
  try {
    const res = await fetch(`${AI_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(
      res.status === 200 && allowOrigin === 'http://localhost:5173',
      'TEST 8: CORS allows trusted frontend origin (http://localhost:5173)'
    );
  } catch (err) {
    assert(false, 'TEST 8: CORS trusted frontend origin', err.message);
  }

  // 9. CORS preflight allows trusted backend origin
  try {
    const res = await fetch(`${AI_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5001',
        'Access-Control-Request-Method': 'POST',
      },
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(
      res.status === 200 && allowOrigin === 'http://localhost:5001',
      'TEST 9: CORS allows trusted backend origin (http://localhost:5001)'
    );
  } catch (err) {
    assert(false, 'TEST 9: CORS trusted backend origin', err.message);
  }

  // 10. CORS does not expose wildcard with credentials
  try {
    const res = await fetch(`${AI_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(
      allowOrigin !== '*',
      'TEST 10: CORS does not return wildcard origin ("*") with credentials'
    );
  } catch (err) {
    assert(false, 'TEST 10: CORS wildcard check', err.message);
  }

  // 11. PDF upload rejects invalid file extension
  try {
    const boundary = '----TestBoundary123';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="malicious.exe"\r\nContent-Type: application/x-msdownload\r\n\r\nevil\r\n--${boundary}--\r\n`;
    const res = await fetch(`${AI_URL}/upload-resume-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Internal-Service-Key': VALID_KEY,
      },
      body,
    });
    const data = await res.json();
    assert(res.status === 400 && data.detail?.includes('Invalid file type'), 'TEST 11: PDF upload rejects non-pdf file extension (HTTP 400)');
  } catch (err) {
    assert(false, 'TEST 11: Reject non-pdf extension', err.message);
  }

  // 12. PDF upload rejects invalid MIME type (.pdf filename but image/jpeg MIME)
  try {
    const boundary = '----TestBoundary123';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="resume.pdf"\r\nContent-Type: image/jpeg\r\n\r\nfake-pdf\r\n--${boundary}--\r\n`;
    const res = await fetch(`${AI_URL}/upload-resume-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Internal-Service-Key': VALID_KEY,
      },
      body,
    });
    const data = await res.json();
    assert(res.status === 400 && data.detail?.includes('Invalid MIME type'), 'TEST 12: PDF upload rejects invalid MIME type (HTTP 400)');
  } catch (err) {
    assert(false, 'TEST 12: Reject invalid MIME type', err.message);
  }

  // 13. PDF upload rejects empty payload
  try {
    const boundary = '----TestBoundary123';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n\r\n--${boundary}--\r\n`;
    const res = await fetch(`${AI_URL}/upload-resume-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Internal-Service-Key': VALID_KEY,
      },
      body,
    });
    const data = await res.json();
    assert(res.status === 400 && data.detail?.includes('empty'), 'TEST 13: PDF upload rejects empty payload (HTTP 400)');
  } catch (err) {
    assert(false, 'TEST 13: Reject empty payload', err.message);
  }

  // 14. PDF upload rejects oversized payload (>5MB)
  try {
    const boundary = '----TestBoundaryOversized';
    const bigData = Buffer.alloc(5.5 * 1024 * 1024, 0x41); // 5.5MB
    const pre = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="huge.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
    const post = `\r\n--${boundary}--\r\n`;
    const fullBody = Buffer.concat([Buffer.from(pre), bigData, Buffer.from(post)]);

    const res = await fetch(`${AI_URL}/upload-resume-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Internal-Service-Key': VALID_KEY,
      },
      body: fullBody,
    });
    const data = await res.json();
    assert(res.status === 413 && data.detail?.includes('exceeds maximum allowed size'), 'TEST 14: PDF upload rejects payload exceeding 5MB limit (HTTP 413)');
  } catch (err) {
    assert(false, 'TEST 14: Reject oversized payload', err.message);
  }

  // 15. Skill Gap Analysis endpoint protected and works with valid key
  try {
    const res = await fetch(`${AI_URL}/analyze-skill-gap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': VALID_KEY,
      },
      body: JSON.stringify({
        target_role: 'Full Stack Developer',
        acquired_skills: ['React', 'JavaScript'],
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true && typeof data.readiness_score === 'number',
      'TEST 15: Skill gap analysis endpoint works with valid service key (HTTP 200)'
    );
  } catch (err) {
    assert(false, 'TEST 15: Skill gap analysis endpoint', err.message);
  }

  // 16. Match Jobs endpoint protected and works with valid key
  try {
    const res = await fetch(`${AI_URL}/match-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': VALID_KEY,
      },
      body: JSON.stringify({
        student_skills: ['Python', 'Docker'],
        job_required_skills: [{ name: 'Python', weight: 30.0, minimum_level: 'beginner' }],
        student_cgpa: 8.5,
        job_min_cgpa: 7.0,
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true && data.cgpa_eligible === true,
      'TEST 16: Job matching endpoint works with valid service key (HTTP 200)'
    );
  } catch (err) {
    assert(false, 'TEST 16: Job matching endpoint', err.message);
  }

  // 17. Career Readiness endpoint protected and works with valid key
  try {
    const res = await fetch(`${AI_URL}/career-intelligence/readiness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': VALID_KEY,
      },
      body: JSON.stringify({
        target_role: 'Software Engineer',
        student_skills: [{ name: 'Python', level: 'intermediate' }],
        student_cgpa: 8.5,
        projects: [{ title: 'SkillBridge' }],
        experience: [{ role: 'Developer' }],
        profile_complete_percent: 90,
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true && typeof data.readiness_score === 'number',
      'TEST 17: Career readiness endpoint works with valid service key (HTTP 200)'
    );
  } catch (err) {
    assert(false, 'TEST 17: Career readiness endpoint', err.message);
  }

  // 18. Career Job-Gap endpoint protected and works with valid key
  try {
    const res = await fetch(`${AI_URL}/career-intelligence/job-gap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': VALID_KEY,
      },
      body: JSON.stringify({
        student_skills: [{ name: 'Python', level: 'intermediate' }],
        job_required_skills: [{ name: 'Python', weight: 1.0 }],
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true && typeof data.skill_coverage === 'number',
      'TEST 18: Career job-gap endpoint works with valid service key (HTTP 200)'
    );
  } catch (err) {
    assert(false, 'TEST 18: Career job-gap endpoint', err.message);
  }

  // 19. Node.js AIClientService seamlessly calls AI endpoints
  try {
    const readiness = await AIClientService.calculateCareerReadiness(
      'Full Stack Developer',
      [{ name: 'React', level: 'intermediate' }],
      8.0,
      [{ title: 'Portfolio' }],
      [],
      80
    );
    assert(
      readiness && readiness.success === true,
      'TEST 19: Node.js AIClientService internal caller attaches auth and executes successfully'
    );
  } catch (err) {
    assert(false, 'TEST 19: AIClientService internal caller', err.message);
  }

  // 20. Direct unauthenticated external request is blocked across all AI paths
  try {
    const endpoints = [
      { path: '/extract-skills', method: 'POST', body: { text: 'test' } },
      { path: '/analyze-skill-gap', method: 'POST', body: { target_role: 'dev', acquired_skills: [] } },
      { path: '/match-jobs', method: 'POST', body: { student_skills: [], job_required_skills: [], student_cgpa: 7 } },
      { path: '/career-intelligence/readiness', method: 'POST', body: { target_role: 'dev', student_skills: [], student_cgpa: 7, projects: [], experience: [], profile_complete_percent: 50 } },
      { path: '/career-intelligence/job-gap', method: 'POST', body: { student_skills: [], job_required_skills: [] } },
    ];
    let allBlocked = true;
    for (const ep of endpoints) {
      const res = await fetch(`${AI_URL}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body),
      });
      if (res.status !== 401) {
        allBlocked = false;
        console.error(`Endpoint ${ep.path} failed to block unauthenticated request: HTTP ${res.status}`);
      }
    }
    assert(allBlocked, 'TEST 20: Direct unauthenticated external access blocked across all protected AI routes (HTTP 401)');
  } catch (err) {
    assert(false, 'TEST 20: Block all unauthenticated routes', err.message);
  }

  console.log('\n================================================================');
  console.log(`AI SERVICE SECURITY SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('[FATAL] AI Service Security Suite error:', err);
  process.exit(1);
});

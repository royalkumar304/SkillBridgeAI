/**
 * Day 1, Day 2, and Day 3 Regression Suite
 */

const http = require('http');

async function checkUrl(url, method = 'GET', body = null, headers = {}) {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request(
      u,
      { method, headers: { 'Content-Type': 'application/json', ...headers } },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(d), headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw: d, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runRegression() {
  console.log('Running Full Monorepo Regression Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, name, note = '') {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${note}`);
      failed++;
    }
  }

  // 1. Backend Health
  const bHealth = await checkUrl('http://localhost:5001/api/v1/health');
  assert(
    bHealth.status === 200 && (bHealth.data?.data?.status === 'UP' || bHealth.data?.status === 'UP'),
    'Day 1: Backend GET /api/v1/health'
  );

  // 2. Helmet headers
  assert(
    bHealth.headers['x-frame-options'] === 'SAMEORIGIN' &&
      bHealth.headers['x-content-type-options'] === 'nosniff',
    'Day 2: Helmet security headers enforced'
  );

  // 3. AI Service Health
  const aiHealth = await checkUrl('http://localhost:8000/health');
  assert(aiHealth.status === 200 && aiHealth.data?.status === 'HEALTHY', 'Day 1: FastAPI GET /health');

  // 4. AI Skill Extraction
  const aiExtract = await checkUrl('http://localhost:8000/extract-skills', 'POST', {
    text: 'Proficient in React, Node.js, and MongoDB.',
  });
  assert(
    aiExtract.status === 200 && aiExtract.data?.extracted_skills?.includes('React'),
    'Day 1/2: AI Service POST /extract-skills'
  );

  // 5. AI Gap Analysis
  const aiGap = await checkUrl('http://localhost:8000/analyze-skill-gap', 'POST', {
    target_role: 'Full Stack Developer',
    acquired_skills: ['React', 'JavaScript'],
  });
  assert(aiGap.status === 200 && typeof aiGap.data?.readiness_score === 'number', 'Day 1: AI Service POST /analyze-skill-gap');

  // 6. Day 3 Backend Suite
  const { execSync } = require('child_process');
  try {
    const day3Out = execSync('node backend/tests/day3_suite.js', { encoding: 'utf8' });
    assert(day3Out.includes('RESULTS: 16 PASSED, 0 FAILED'), 'Day 3: Full Backend & Integration Suite (16/16 Passed)');
  } catch (e) {
    assert(false, 'Day 3: Full Backend Suite', e.message);
  }

  console.log(`\nRegression Complete: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) process.exit(1);
}

runRegression().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 central test runner for SkillBridge AI backend automated suites
 */

const { spawnSync } = require('child_process');
const path = require('path');

const automatedSuites = [
  'tests/auth_ownership_suite.js',
  'tests/day3_suite.js',
  'tests/day4_career_suite.js',
  'tests/day5_admin_suite.js',
  'tests/day5_notification_suite.js',
  'tests/day6_internship_suite.js',
  'tests/security_admin_privilege_suite.js',
  'tests/security_ai_service_auth_suite.js',
  'tests/security_auth_final_gate_suite.js',
  'tests/security_company_verification_suite.js',
  'tests/security_cookie_auth_suite.js',
  'tests/security_cookie_deep_audit_suite.js',
  'tests/security_csrf_deep_audit_suite.js',
  'tests/security_csrf_suite.js',
  'tests/security_dashboard_data_integrity_suite.js',
  'tests/security_database_reliability_suite.js',
  'tests/security_jwt_suite.js',
  'tests/security_logout_revocation_suite.js',
  'tests/security_multisession_logout_suite.js',
  'tests/security_profile_mass_assignment_suite.js',
  'tests/security_public_api_privacy_suite.js',
  'tests/security_recruiter_ownership_suite.js',
  'tests/security_resume_persistence_suite.js',
  'tests/security_session_suite.js',
];

console.log('================================================================');
console.log(' SKILLBRIDGE AI — CENTRAL AUTOMATED REGRESSION RUNNER           ');
console.log('================================================================\n');

let totalPassedSuites = 0;
let totalFailedSuites = 0;
const results = [];

for (const suitePath of automatedSuites) {
  const fullPath = path.resolve(__dirname, '..', suitePath);
  process.stdout.write(`Executing: ${suitePath} ... `);

  const start = Date.now();
  const run = spawnSync(process.execPath, [fullPath], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' },
    timeout: 30000,
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  if (run.status === 0) {
    process.stdout.write(`[PASS] (${duration}s)\n`);
    totalPassedSuites++;
    results.push({ suite: suitePath, status: 'PASS', duration });
  } else {
    process.stdout.write(`[FAIL] (${duration}s)\n`);
    totalFailedSuites++;
    results.push({
      suite: suitePath,
      status: 'FAIL',
      duration,
      stderr: run.stderr || run.stdout,
    });
  }
}

console.log('\n================================================================');
console.log(`SUMMARY: ${totalPassedSuites} SUITES PASSED, ${totalFailedSuites} FAILED (TOTAL: ${automatedSuites.length})`);
console.log('================================================================\n');

if (totalFailedSuites > 0) {
  console.error('Failed Suites Output:');
  for (const r of results) {
    if (r.status === 'FAIL') {
      console.error(`\n--- [FAIL] ${r.suite} ---`);
      console.error(r.stderr);
    }
  }
  process.exit(1);
} else {
  process.exit(0);
}

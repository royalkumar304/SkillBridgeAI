/**
 * Unit & Regression Tests for React Router Redirect & Navigation Security
 * Validates:
 * - Proper resolution of standard internal routes
 * - Rejection of protocol-relative URLs (e.g. //attacker.com)
 * - Rejection of backslash-based path confusion (e.g. /\attacker.com, \attacker.com)
 * - Rejection of dangerous URL schemes (javascript:, data:, vbscript:)
 * - Rejection of control characters and backslashes in redirect paths
 */

import assert from 'node:assert';
import { sanitizeRedirectPath } from '../src/utils/safeRedirect.js';

console.log('================================================================');
console.log('  FRONTEND NAVIGATION & REDIRECT SECURITY TEST SUITE             ');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name} - ${err.message}`);
    failed++;
  }
}

const DEFAULT_DEST = '/student/dashboard';

// Valid internal paths
test('Allows legitimate internal route /student/dashboard', () => {
  assert.strictEqual(sanitizeRedirectPath('/student/dashboard', DEFAULT_DEST), '/student/dashboard');
});

test('Allows nested internal route with query parameters /student/jobs?filter=react', () => {
  assert.strictEqual(sanitizeRedirectPath('/student/jobs?filter=react', DEFAULT_DEST), '/student/jobs?filter=react');
});

test('Allows deep admin sub-route /admin/companies/approvals', () => {
  assert.strictEqual(sanitizeRedirectPath('/admin/companies/approvals', DEFAULT_DEST), '/admin/companies/approvals');
});

// Protocol-relative attacks
test('Neutralizes protocol-relative URL //evil.com to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('//evil.com', DEFAULT_DEST), DEFAULT_DEST);
});

test('Neutralizes protocol-relative URL ///evil.com to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('///evil.com', DEFAULT_DEST), DEFAULT_DEST);
});

// Backslash evasion attacks
test('Neutralizes backslash bypass /\\evil.com to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('/\\evil.com', DEFAULT_DEST), DEFAULT_DEST);
});

test('Neutralizes leading backslash \\evil.com to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('\\evil.com', DEFAULT_DEST), DEFAULT_DEST);
});

test('Neutralizes mid-path backslash /redirect\\evil.com to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('/redirect\\evil.com', DEFAULT_DEST), DEFAULT_DEST);
});

// Dangerous schemes
test('Neutralizes javascript: scheme /javascript:alert(1) to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('/javascript:alert(1)', DEFAULT_DEST), DEFAULT_DEST);
});

test('Neutralizes data: scheme /data:text/html,<script>alert(1)</script> to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('/data:text/html,<script>alert(1)</script>', DEFAULT_DEST), DEFAULT_DEST);
});

test('Neutralizes CRLF injection in path /dashboard\\r\\nSet-Cookie:evil=1 to fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('/dashboard\r\nSet-Cookie:evil=1', DEFAULT_DEST), DEFAULT_DEST);
});

// Null, empty, and non-string inputs
test('Falls back gracefully on null or undefined path', () => {
  assert.strictEqual(sanitizeRedirectPath(null, DEFAULT_DEST), DEFAULT_DEST);
  assert.strictEqual(sanitizeRedirectPath(undefined, DEFAULT_DEST), DEFAULT_DEST);
});

test('Falls back gracefully on non-string input (e.g. object, number)', () => {
  assert.strictEqual(sanitizeRedirectPath({}, DEFAULT_DEST), DEFAULT_DEST);
  assert.strictEqual(sanitizeRedirectPath(12345, DEFAULT_DEST), DEFAULT_DEST);
});

console.log('\n================================================================');
console.log(`NAVIGATION SECURITY SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

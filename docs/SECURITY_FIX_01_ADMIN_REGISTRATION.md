# SkillBridge AI — Security Fix Report: Admin Privilege Escalation Prevention
**Vulnerability ID:** SEC-FIX-01  
**Severity:** Critical (CVSS 9.8)  
**Date:** 2026-11-17  
**Module:** Authentication & Access Control  
**Auditor / Engineer:** Senior Backend Security Engineer & Full Stack Developer  

---

## 1. Original Vulnerability

The public user registration endpoint (`POST /api/v1/auth/register`) accepted arbitrary role assignments from the incoming request body, including `UNIVERSITY_ADMIN`. Consequently, an unauthenticated attacker could supply:
```json
{
  "name": "Attacker Admin",
  "email": "attacker@exploit.io",
  "password": "Password@123",
  "role": "UNIVERSITY_ADMIN"
}
```
and obtain a valid JWT token with elevated `UNIVERSITY_ADMIN` capabilities. In addition, the frontend registration dropdown on `/register` exposed "University Administrator / TPO" as a selectable option to all unauthenticated public visitors.

---

## 2. Root Cause

1. **Permissive Role Whitelist:** In `backend/src/controllers/authController.js`, `validRoles` was defined as `['STUDENT', 'UNIVERSITY_ADMIN', 'RECRUITER']`. There was no separation between public self-service registration roles and administrative roles.
2. **Missing Controller-Level Defense-in-Depth:** The system lacked an explicit rejection rule for administrative and privileged role strings during public onboarding.
3. **Frontend UI Exposure:** `frontend/src/pages/auth/Register.jsx` included `<option value="UNIVERSITY_ADMIN">` in the public form.

---

## 3. Files Modified

| File | Type | Changes |
|---|---|---|
| `backend/src/controllers/authController.js` | Backend Controller | Enforced strict role whitelisting (`['STUDENT', 'RECRUITER']`). Added type safety check ensuring `role` is a string. Explicitly rejected `UNIVERSITY_ADMIN`, `ADMIN`, whitespace-padded or non-string role injection with HTTP 400. |
| `frontend/src/pages/auth/Register.jsx` | Frontend UI | Removed `UNIVERSITY_ADMIN` from public role dropdown, leaving only `STUDENT` and `RECRUITER`. |
| `backend/scripts/provisionAdmin.js` | Backend CLI Tool | Created secure, CLI-only admin provisioning script with interactive hidden password input, environment variable support, `bcryptjs` hashing, and duplicate detection. |
| `backend/tests/security_admin_privilege_suite.js` | Test Suite | Created comprehensive 12-scenario test suite proving privilege escalation is impossible. |
| `backend/tests/day3_suite.js` | Test Suite | Updated test admin credential acquisition to authenticate via pre-provisioned admin rather than public registration. |
| `backend/tests/day4_career_suite.js` | Test Suite | Updated test admin credential acquisition to authenticate via pre-provisioned admin. |
| `backend/tests/day5_admin_suite.js` | Test Suite | Updated test admin credential acquisition to authenticate via pre-provisioned admin. |
| `backend/tests/day5_notification_suite.js` | Test Suite | Updated test admin credential acquisition to authenticate via pre-provisioned admin. |
| `backend/tests/day6_internship_suite.js` | Test Suite | Updated test admin credential acquisition to authenticate via pre-provisioned admin. |
| `README.md` | Documentation | Added CLI admin provisioning instructions. |
| `docs/LOCAL_SETUP_GUIDE.md` | Documentation | Added Step E explaining secure admin creation via CLI. |
| `docs/FINAL_SECURITY_AUDIT.md` | Documentation | Added vulnerability mitigation entry for SEC-FIX-01. |

---

## 4. Changes Implemented

### 4.1 Backend Controller Hardening (`backend/src/controllers/authController.js`)
```javascript
if (role !== undefined && typeof role !== 'string') {
  return errorResponse(res, 400, 'Invalid Registration Role', 'Role parameter must be a string');
}

const assignedRole = (typeof role === 'string' && role.trim()) ? role.trim().toUpperCase() : 'STUDENT';
const allowedPublicRoles = ['STUDENT', 'RECRUITER'];

// Explicit security check: Prevent privilege escalation via public registration
if (assignedRole === 'UNIVERSITY_ADMIN' || assignedRole === 'ADMIN' || !allowedPublicRoles.includes(assignedRole)) {
  return errorResponse(
    res,
    400,
    'Invalid Registration Role',
    'Direct registration for administrative roles is prohibited. Public registration is restricted to STUDENT and RECRUITER only.'
  );
}
```

### 4.2 Frontend Registration Clean-up (`frontend/src/pages/auth/Register.jsx`)
Removed `<option value="UNIVERSITY_ADMIN">` from the dropdown. Public users can select only:
- Student (Job Seeker / Learner)
- Company Recruiter (Employer)

### 4.3 Secure CLI Admin Provisioning Tool (`backend/scripts/provisionAdmin.js`)
- Runs exclusively on the backend host machine (`node backend/scripts/provisionAdmin.js`).
- Never exposes an HTTP endpoint or web route.
- Interactive mode hides password keystrokes on standard TTY.
- CI/automation mode supports `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` environment variables.
- Enforces minimum 8 characters for admin passwords.
- Hashes password using standard `User.hashPassword` (`bcryptjs` salt rounds 10).
- Explicitly prevents duplicate admin registrations.
- Never logs, echoes, or persists plaintext credentials.

---

## 5. Admin Provisioning Instructions

### Interactive Mode (Local Terminal)
```bash
node backend/scripts/provisionAdmin.js
```
The CLI will interactively request:
- `Enter Admin Email Address:`
- `Enter Admin Full Name:`
- `Enter Admin Password (hidden, min 8 chars):`

### Non-Interactive / Scripted Mode
```powershell
$env:ADMIN_EMAIL="admin@univ.edu"; $env:ADMIN_PASSWORD="SecurePassword@123"; $env:ADMIN_NAME="Dean S. K. Verma"; node backend/scripts/provisionAdmin.js
```

---

## 6. Tests Executed & Results

Executed the dedicated security test suite `backend/tests/security_admin_privilege_suite.js`:

| # | Test Scenario | HTTP Status / Assert | Result |
|---|---|---|---|
| **TEST 1** | Student registration succeeds | `HTTP 201`, role: `STUDENT` | **PASS** |
| **TEST 2** | Recruiter registration succeeds | `HTTP 201`, role: `RECRUITER` | **PASS** |
| **TEST 3** | Registration with `UNIVERSITY_ADMIN` rejected | `HTTP 400 Bad Request` | **PASS** |
| **TEST 4** | Registration with `ADMIN` rejected | `HTTP 400 Bad Request` | **PASS** |
| **TEST 5** | Registration with arbitrary role `SUPER_ADMIN` rejected | `HTTP 400 Bad Request` | **PASS** |
| **TEST 6** | Manipulated API requests (whitespace, lowercase, object injection) rejected | `HTTP 400 Bad Request` | **PASS** |
| **TEST 7** | Normal student login still works | `HTTP 200`, valid JWT | **PASS** |
| **TEST 8** | Normal recruiter login still works | `HTTP 200`, valid JWT | **PASS** |
| **TEST 9a** | CLI provisioning sets role to `UNIVERSITY_ADMIN` | Direct MongoDB insertion | **PASS** |
| **TEST 9b** | Provisioned admin login works | `HTTP 200`, valid JWT | **PASS** |
| **TEST 10** | Admin-only APIs reject student and recruiter | `HTTP 403 Forbidden` | **PASS** |
| **TEST 11** | Duplicate registration remains rejected | `HTTP 409 Conflict` | **PASS** |
| **TEST 12** | Password hashing verified via bcrypt | Salted bcrypt hash `$2...` | **PASS** |

### Regression Suites Executed
- `node backend/tests/regression_suite.js`: **6/6 PASSED**
- `node backend/tests/auth_ownership_suite.js`: **12/12 PASSED**
- `node backend/tests/day3_suite.js`: **16/16 PASSED**
- `node backend/tests/day4_career_suite.js`: **18/18 PASSED**
- `node backend/tests/day5_admin_suite.js`: **19/19 PASSED**
- `node backend/tests/day5_notification_suite.js`: **18/18 PASSED**
- `node backend/tests/day6_internship_suite.js`: **18/18 PASSED**
- Frontend Production Build (`npm --prefix frontend run build`): **1622 modules transformed, built with 0 errors**.

---

## 7. Remaining Risks

- **Threat:** Loss or theft of backend server terminal access.  
  - *Risk Level:* Low.
  - *Mitigation:* Administrator provisioning requires direct shell/terminal execution on the host machine or authenticated infrastructure access with MongoDB connection credentials.
- **Threat:** Brute-force guessing of existing administrator credentials.
  - *Risk Level:* Low.
  - *Mitigation:* Rate limiter (`express-rate-limit`) is active across `/auth/login` and `/auth/register` to mitigate brute-force attacks.

---

## 8. Git Safety Check

- `git status --short` verified.
- No `.env` files or credentials are tracked or staged.
- Working tree preserved; no commits created; no remote pushes made.

---

## 9. Conclusion

**VULNERABILITY STATUS: FIXED AND VERIFIED.**  
Public registration is strictly restricted to `STUDENT` and `RECRUITER`. All attempts to inject administrative roles via HTTP requests are rejected with `HTTP 400`. University Administrator accounts can only be provisioned via local CLI execution with salted bcrypt hashing.

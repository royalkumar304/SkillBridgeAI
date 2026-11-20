# SkillBridge AI — Security Fix Report: Recruiter-to-Company Ownership Authorization
**Vulnerability ID:** SEC-FIX-03  
**Severity:** Critical (CVSS 8.8)  
**Date:** 2026-11-17  
**Module:** Recruiter / Job / Company Governance  
**Auditor / Engineer:** Senior Backend Security Engineer & Full Stack Developer  

---

## 1. Original Vulnerability & Root Cause

### Original Vulnerability
Previously in `backend/src/controllers/jobController.js`, when a recruiter created a job posting (`POST /api/v1/jobs`), the controller accepted an optional `companyId` directly from the request payload:
```javascript
let targetCompanyId = companyId;
let company = null;
if (targetCompanyId && mongoose.Types.ObjectId.isValid(targetCompanyId)) {
  company = await Company.findById(targetCompanyId);
}
```
If an attacker supplied another recruiter's `companyId` (e.g., Company B), the backend verified that Company B was verified in the system, but **failed to verify that the authenticated recruiter (Recruiter A) was the legitimate owner of Company B**.

Consequently, Recruiter A could:
1. Publish fraudulent job or internship postings under Recruiter B's accredited corporate brand.
2. Exploit Recruiter B's verified partner status to bypass accreditation gates.
3. Attempt mass assignment on `companyId` during job updates.

### Root Cause
- The data link between `Company` and its owner is stored in `Company.recruiterUserId` referencing `User._id`.
- The job creation endpoint trusted client-provided `companyId` without asserting `company.recruiterUserId.toString() === req.user.id`.
- Parameter tampering on `companyId`, `postedBy`, or `recruiterUserId` in incoming JSON payloads was not rejected server-side.

---

## 2. Affected Endpoints

| Method | Endpoint | Role | Vulnerability |
|---|---|---|---|
| `POST` | `/api/v1/jobs` | `RECRUITER` | Recruiter could specify arbitrary `companyId` belonging to another recruiter. |
| `PUT` | `/api/v1/jobs/:id` | `RECRUITER` | Missing explicit check on `job.companyId` ownership and vulnerable to mass-assignment `companyId` reassignment. |
| `PATCH` | `/api/v1/jobs/:id/status` | `RECRUITER` | Missing company ownership validation and malformed ID validation. |
| `DELETE` | `/api/v1/jobs/:id` | `RECRUITER` | Missing company ownership validation and malformed ID validation. |
| `GET` | `/api/v1/jobs/:id/applications`| `RECRUITER` | Malformed ID could trigger unhandled cast errors. |
| `PATCH` | `/api/v1/applications/:id/status` | `RECRUITER` | Malformed ID could trigger unhandled cast errors. |

---

## 3. Ownership Enforcement Approach

### 3.1 Strict Server-Side Company Ownership (`backend/src/controllers/jobController.js`)
When a recruiter provides a `companyId` in `POST /api/v1/jobs`:
1. The ID format is validated (`mongoose.Types.ObjectId.isValid(companyId)`).
2. The company is fetched from the database.
3. Strict ownership check is enforced:
   ```javascript
   if (!company.recruiterUserId || company.recruiterUserId.toString() !== req.user.id) {
     return errorResponse(res, 403, 'Forbidden', 'You are not authorized to create or manage job postings for this company');
   }
   ```
4. If no `companyId` is supplied, the server automatically resolves or provisions the company linked to `req.user.id` (`Company.findOne({ recruiterUserId: req.user.id })`).
5. Client-supplied `postedBy` or `recruiterUserId` in the request body is strictly ignored; `postedBy` is derived server-side from `req.user.id`.
6. Company verification gate (`company.verified === true`) continues to be strictly enforced.

### 3.2 Double-Layered Ownership Guard on Job Lifecycle (`PUT`, `PATCH`, `DELETE`)
In addition to checking `job.postedBy.toString() === req.user.id`, the backend now verifies company ownership:
```javascript
if (job.companyId) {
  const company = await Company.findById(job.companyId);
  if (company && company.recruiterUserId && company.recruiterUserId.toString() !== req.user.id) {
    return errorResponse(res, 403, 'Forbidden', 'You do not own the company associated with this job');
  }
}
```
Furthermore, `companyId` is strictly omitted from `allowedUpdates` in `updateJob`, preventing mass-assignment transfer to another company.

### 3.3 Robust Malformed ID Handling
All endpoints taking `:id` route parameters (`getJobById`, `updateJob`, `updateJobStatus`, `deleteJob`, `getJobMatch`, `getJobApplications`, `updateApplicationStatus`) safely validate ObjectId formats and return `HTTP 400 Bad Request` rather than crashing or triggering unhandled database cast errors.

---

## 4. Files Created and Modified

| File | Status | Description |
|---|---|---|
| `backend/src/controllers/jobController.js` | Modified | Added strict recruiter company ownership validation on `createJob`, `updateJob`, `updateJobStatus`, `deleteJob`, and robust ID validation across all routes. |
| `backend/src/controllers/applicationController.js` | Modified | Added safe ObjectId format validation on application inspection and status updates. |
| `backend/tests/security_recruiter_ownership_suite.js` | Created | Comprehensive 15-scenario automated test suite verifying company ownership, spoofing prevention, mass assignment protection, and internship isolation. |
| `backend/tests/auth_ownership_suite.js` | Modified | Aligned setup with the Day 5 company verification requirement for test recruiters. |
| `docs/SECURITY_FIX_03_RECRUITER_COMPANY_OWNERSHIP.md` | Created | Full technical documentation and audit evidence. |

---

## 5. Security Test Results (`backend/tests/security_recruiter_ownership_suite.js`)

Executed against live backend on port 5001:

| # | Test Scenario | Verified Status | Result |
|---|---|---|---|
| **TEST 1** | Recruiter A creates job for own verified company | `HTTP 201 Created` | **PASS** |
| **TEST 2** | Recruiter A cannot create job for Recruiter B's company | `HTTP 403 Forbidden` | **PASS** |
| **TEST 3** | Recruiter A cannot use arbitrary/nonexistent companyId | `HTTP 404 Not Found` | **PASS** |
| **TEST 4** | Recruiter A cannot update Recruiter B's job | `HTTP 403 Forbidden` | **PASS** |
| **TEST 5** | Recruiter A cannot delete Recruiter B's job | `HTTP 403 Forbidden` | **PASS** |
| **TEST 6** | Recruiter A cannot change status of Recruiter B's job | `HTTP 403 Forbidden` | **PASS** |
| **TEST 7** | Mass-assignment transfer of `companyId` is blocked | `companyId` unchanged | **PASS** |
| **TEST 8** | Cannot bypass ownership via body parameter injection | `HTTP 403 Forbidden` | **PASS** |
| **TEST 9** | Unauthenticated requests return HTTP 401 | `HTTP 401 Unauthorized` | **PASS** |
| **TEST 10** | Unverified companies cannot create/publish jobs | `HTTP 403 Approval Gate` | **PASS** |
| **TEST 11** | Authorized company owner can update job and status | `HTTP 200 OK` | **PASS** |
| **TEST 12** | University Admin continues accessing company governance | `HTTP 200 OK` | **PASS** |
| **TEST 13** | Nonexistent company/job IDs return safe errors | `HTTP 404 Not Found` | **PASS** |
| **TEST 14** | Malformed IDs return clean HTTP 400 Validation Error | `HTTP 400 Bad Request` | **PASS** |
| **TEST 15** | Internships strictly enforce company ownership | `HTTP 403 Forbidden` | **PASS** |

**Security Test Result: 17 / 17 Assertions PASSED (0 FAILED)**

---

## 6. All Regression Test Results

Every automated test suite in the repository was executed sequentially:

1. `backend/tests/security_recruiter_ownership_suite.js`: **17/17 PASSED**
2. `backend/tests/security_admin_privilege_suite.js`: **13/13 PASSED**
3. `backend/tests/security_jwt_suite.js`: **15/15 PASSED**
4. `backend/tests/auth_ownership_suite.js`: **12/12 PASSED**
5. `backend/tests/regression_suite.js`: **6/6 PASSED**
6. `backend/tests/day3_suite.js`: **16/16 PASSED**
7. `backend/tests/day4_career_suite.js`: **18/18 PASSED**
8. `backend/tests/day5_admin_suite.js`: **19/19 PASSED**
9. `backend/tests/day5_notification_suite.js`: **18/18 PASSED**
10. `backend/tests/day6_internship_suite.js`: **18/18 PASSED**

**Total Test Count: 152 / 152 Tests Passed Across All Suites (100% Pass Rate).**

---

## 7. Frontend Production Build

Executed `npm --prefix frontend run build`:
```text
> skillbridge-frontend@1.0.0 build
> vite build

vite v6.4.6 building for production...
transforming...
✓ 1622 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.08 kB │ gzip:   0.63 kB
dist/assets/index-Dp5uwAQn.css   38.98 kB │ gzip:   6.98 kB
dist/assets/index-7wB2z-0K.js   434.34 kB │ gzip: 105.29 kB
✓ built in 3.26s
```
**Build Status: SUCCESS (0 errors, 0 warnings)**

---

## 8. Git Safety Verification (`git status --short`)

- `.env` remains untracked and excluded.
- Zero commits created.
- Zero changes pushed.
- Working tree and all previous security and feature work preserved.

---

## 9. Remaining Risks or Blockers
- **None.** All recruiter-to-company authorization boundaries are strictly enforced server-side. Company spoofing, unauthorized job creation, mass-assignment company reassignment, and cross-recruiter modifications are completely mitigated.

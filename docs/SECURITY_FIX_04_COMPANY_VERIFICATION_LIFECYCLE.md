# SkillBridge AI — Security Fix Report: Company Verification Lifecycle & Job Publishing Security
**Vulnerability ID:** SEC-FIX-04  
**Severity:** Critical (CVSS 8.9)  
**Date:** 2026-11-17  
**Module:** Corporate Accreditation Lifecycle & Public Catalog Protection  
**Auditor / Engineer:** Senior Backend Security Engineer & Multi-Tenant Systems Architect  

---

## 1. Original Vulnerability & Root Cause

### Original Vulnerability
Previously, while company verification was checked when initially creating a job in `createJob`, critical lifecycle and public visibility loopholes existed:
1. **Public Listing Bypass:** The public job endpoint (`GET /api/v1/jobs`) filtered strictly on `status: { $in: ['active', 'published'] }` without asserting whether the company itself was verified. If an approved company was later **revoked** or **rejected** by an administrator, all previously published jobs and internships remained publicly discoverable.
2. **Public Detail Bypass:** The single job details endpoint (`GET /api/v1/jobs/:id`) fetched any job by its ID without checking whether the associated company was accredited, allowing direct URL access to jobs from revoked/rejected companies.
3. **Reactivation Loophole:** In `updateJobStatus` (`PATCH /api/v1/jobs/:id/status`) and `updateJob` (`PUT /api/v1/jobs/:id`), a recruiter whose company verification had been revoked or rejected could reactivate draft or closed jobs by setting `status: 'active'`, circumventing the administrative revocation entirely.
4. **Student Career Discovery Leak:** In `careerIntelligenceController.js`, `/career/jobs-analysis` returned job recommendations without checking if the parent companies were accredited.
5. **Application Acceptance on Revoked Postings:** Students could still submit applications to jobs of revoked companies because `createApplication` only checked `job.status`.

### Root Cause
- Verification status was treated as an isolated one-time creation check rather than a dynamic continuous lifecycle condition enforced at all read, discovery, application, and status-transition boundaries.
- No unified verification state audit trail (`verificationStatus`, `verifiedAt`, `approvedBy`) was persisted on the `Company` schema.

---

## 2. Affected Endpoints

| Method | Endpoint | Role / Access | Vulnerability Mitigated |
|---|---|---|---|
| `GET` | `/api/v1/jobs` | Public / Students | Filtered exclusively by `status`; leaked postings of unverified, rejected, and revoked partners. |
| `GET` | `/api/v1/jobs/:id` | Public / Students | Allowed direct access to jobs belonging to unverified or revoked companies. |
| `PATCH` | `/api/v1/jobs/:id/status` | `RECRUITER` | Allowed recruiters with revoked accreditation to reactivate jobs. |
| `PUT` | `/api/v1/jobs/:id` | `RECRUITER` | Allowed recruiters with revoked accreditation to set `status: 'active'`. |
| `GET` | `/api/v1/career/jobs-analysis` | `STUDENT` | Leaked unaccredited company opportunities in AI comparison recommendations. |
| `POST` | `/api/v1/applications` | `STUDENT` | Allowed students to apply to jobs from revoked corporate partners. |
| `PATCH` | `/api/v1/admin/companies/:id/verify`| `UNIVERSITY_ADMIN` | Extended to manage granular states (`APPROVED`, `REJECTED`, `REVOKED`) with audit metadata. |

---

## 3. Verification Lifecycle & Public Visibility Rules

### 3.1 Company Verification Lifecycle (`backend/src/models/Company.js` & `adminController.js`)
- Enriched `Company` model with:
  - `verified`: Boolean flag (`true` / `false`).
  - `verificationStatus`: Enum (`PENDING`, `APPROVED`, `REJECTED`, `REVOKED`).
  - `verifiedAt`: Timestamp of approval.
  - `approvedBy`: Admin user ObjectId.
- `PATCH /api/v1/admin/companies/:id/verify` accepts boolean `verified` and/or explicit `status`:
  - `verified: true` or `status: 'APPROVED'` sets `verified: true`, `verificationStatus: 'APPROVED'`, records `verifiedAt = Date.now()`, and dispatches approval notifications.
  - `verified: false` or `status: 'REVOKED'` / `'REJECTED'` sets `verified: false`, records `verificationStatus`, and dispatches revocation notifications.
- Recruiters cannot modify `verified`, `verificationStatus`, `verifiedAt`, or `approvedBy` through `PUT /companies/profile` (untrusted fields are ignored).

### 3.2 Continuous Visibility & Discovery Policy
1. **Public & Student Job Catalogs (`GET /api/v1/jobs`):**
   - Automatically resolves all verified companies (`Company.find({ verified: true })`).
   - Restricts query strictly to `{ status: { $in: ['active', 'published'] }, companyId: { $in: verifiedCompanyIds } }`.
   - Any revocation by an admin takes **instant effect**, hiding all postings from public and search listings without requiring manual batch edits on jobs.
2. **Direct Job Details (`GET /api/v1/jobs/:id`):**
   - Populates company verification attributes.
   - Rejects public or non-owner requests with `HTTP 403 Forbidden` if `company.verified === false` or `verificationStatus === 'REVOKED' | 'REJECTED'`.
3. **Student Career Intelligence Discovery (`GET /api/v1/career/jobs-analysis`):**
   - Dynamically filters out opportunities from unverified, rejected, or revoked companies.
4. **Application Submission Gate (`POST /api/v1/applications`):**
   - Validates that the target job belongs to an active verified company before persisting student applications.
5. **Existing Applications Retained:**
   - Previously submitted student applications remain securely accessible in `GET /api/v1/applications/me` for auditing, transparency, and interview tracking.

---

## 4. Files Created and Modified

| File | Status | Description |
|---|---|---|
| `backend/src/models/Company.js` | Modified | Added `verificationStatus`, `verifiedAt`, and `approvedBy` audit fields; added pre-save hook enforcing bi-directional consistency between boolean `verified` and enum `verificationStatus`. |
| `backend/src/utils/verificationPolicy.js` | Created | Central canonical company verification policy (`isCompanyVerified`, `getVerifiedCompanyQuery`) handling modern, legacy, and contradictory records. |
| `backend/src/controllers/adminController.js` | Modified | Hardened `verifyCompany` to update status, timestamps, and admin audit references. |
| `backend/src/controllers/jobController.js` | Modified | Hardened public `getJobs` and `getJobById` with canonical company verification guards; added verification gates in `updateJob` and `updateJobStatus`. |
| `backend/src/controllers/careerIntelligenceController.js` | Modified | Hardened `/career/jobs-analysis` to only compare jobs from verified companies. |
| `backend/src/controllers/applicationController.js` | Modified | Guarded application submission against revoked company postings using canonical policy. |
| `backend/src/routes/jobRoutes.js` | Modified | Attached `optionalAuth` to `GET /jobs/:id` for owner/admin inspection while protecting public visitors. |
| `backend/src/routes/applicationRoutes.js` | Modified | Added alias `/applications/me` pointing to `getMyApplications`. |
| `backend/tests/security_company_verification_suite.js` | Created | Comprehensive 21-assertion automated security suite covering verification, revocation, re-approval, invariant consistency, legacy records, and 5-role detail matrices. |
| `docs/SECURITY_FIX_04_COMPANY_VERIFICATION_LIFECYCLE.md` | Created | Detailed architecture and audit documentation. |

---

## 5. Security Suite Test Results (`backend/tests/security_company_verification_suite.js`)

Executed against live backend:

| # | Test Scenario | Verified Condition | Result |
|---|---|---|---|
| **TEST 1** | Admin can approve unverified company | `verified=true, status=APPROVED` | **PASS** |
| **TEST 2** | Recruiter cannot access admin verification endpoint | `HTTP 403 Forbidden` | **PASS** |
| **TEST 3** | Recruiter cannot change verified status via PUT /companies/profile | Injection safely ignored | **PASS** |
| **TEST 4** | Unverified company cannot create a published job | `HTTP 403 Approval Gate` | **PASS** |
| **TEST 5** | Revoked company cannot activate a draft job | `HTTP 403 Forbidden` | **PASS** |
| **TEST 6** | Verified company can publish an active job | `HTTP 201 Created` | **PASS** |
| **TEST 7** | Revoked company jobs hidden from public listing GET /jobs | Excluded from listings | **PASS** |
| **TEST 8** | Revoked company jobs inaccessible via public detail GET /jobs/:id | `HTTP 403 Forbidden` | **PASS** |
| **TEST 9** | Rejected company jobs remain hidden from public listings | Excluded from listings | **PASS** |
| **TEST 10** | Recruiter cannot bypass verification via body params in PUT | `HTTP 403 Forbidden` | **PASS** |
| **TEST 11** | Re-verified company jobs automatically become discoverable again | Re-listed in public catalog | **PASS** |
| **TEST 12** | Public job search (?search query) excludes unverified companies | Excluded from search | **PASS** |
| **TEST 13** | Student career intelligence (/career/jobs-analysis) excludes unverified companies | Excluded from comparisons | **PASS** |
| **TEST 14** | Internship listings (?jobType=internship) enforce same policy | Excluded from internships | **PASS** |
| **TEST 15** | Unauthorized users (students 403, unauthenticated 401) blocked from admin endpoints | `HTTP 403 / 401` | **PASS** |
| **TEST 16** | Existing student applications remain accessible in /applications/me | Applications viewable | **PASS** |
| **TEST 17** | Admin continues to govern full companies directory | `HTTP 200 OK` | **PASS** |
| **TEST 18** | Pre-save hook enforces consistency; REVOKED status forces verified=false | `verified=false, status=REVOKED` | **PASS** |
| **TEST 19** | Canonical verification policy safely evaluates legacy and contradictory objects | Pure boolean truth table | **PASS** |
| **TEST 20** | 5-Role Detail Access Matrix: Unauth (403), Student (403), Diff Recruiter (403), Owner (200), Admin (200) | Strictly role-isolated | **PASS** |
| **TEST 21** | Re-verified company jobs are accessible to public and students upon re-approval | Discoverable post-approval | **PASS** |

**New Security Suite Summary: 21 / 21 Assertions PASSED (0 FAILED)**

---

## 6. Complete Monorepo Regression Verification

Executed all 11 test suites across the repository:

1. `backend/tests/security_company_verification_suite.js`: **21/21 PASSED**
2. `backend/tests/security_recruiter_ownership_suite.js`: **17/17 PASSED**
3. `backend/tests/security_admin_privilege_suite.js`: **13/13 PASSED**
4. `backend/tests/security_jwt_suite.js`: **15/15 PASSED**
5. `backend/tests/auth_ownership_suite.js`: **12/12 PASSED**
6. `backend/tests/regression_suite.js`: **6/6 PASSED**
7. `backend/tests/day3_suite.js`: **16/16 PASSED**
8. `backend/tests/day4_career_suite.js`: **18/18 PASSED**
9. `backend/tests/day5_admin_suite.js`: **19/19 PASSED**
10. `backend/tests/day5_notification_suite.js`: **18/18 PASSED**
11. `backend/tests/day6_internship_suite.js`: **18/18 PASSED**

**Monorepo Test Pass Rate: 173 / 173 Tests Passed (100%)**

---

## 7. Frontend Production Build

`npm --prefix frontend run build` completed cleanly:
```text
vite v6.4.6 building for production...
✓ 1622 modules transformed.
dist/index.html                   1.08 kB │ gzip:   0.63 kB
dist/assets/index-Dp5uwAQn.css   38.98 kB │ gzip:   6.98 kB
dist/assets/index-7wB2z-0K.js   434.34 kB │ gzip: 105.29 kB
✓ built in 7.88s
```
**Build Status: SUCCESS (0 errors)**

---

## 8. Git Safety Verification (`git status --short`)

- `.env` remains untracked and excluded by `.gitignore`.
- No credentials, secrets, or passwords staged.
- Zero commits created; zero pushes made.
- All previous feature and security implementations preserved intact.

---

## 9. Remaining Risks or Blockers
- **None.** Corporate verification is now enforced as a continuous lifecycle invariant across all creation, update, activation, public catalog, detail inspection, career intelligence recommendation, and application submission pathways.

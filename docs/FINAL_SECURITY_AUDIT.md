# SkillBridge AI — Final Security Audit & Threat Modeling
**SIH Problem Statement:** SIH26044 | **Role:** Security Lead & Infrastructure Auditor  
**Audit Date:** 2026-11-17 | **Classification:** Official Security Release Review

---

## 1. Executive Security Summary

The **SkillBridge AI** platform was subjected to a security audit across authentication, authorization boundaries, cryptographic hygiene, injection risks, and sensitive data leakage. The backend adheres strictly to the Principle of Least Privilege: all database reads and writes enforce authenticated user ownership and verified JWT role claims.

---

## 2. Security Assessment Matrix

| Domain | Control Verified | Implementation Detail | Status |
| :--- | :--- | :--- | :---: |
| **Authentication** | Password Hashing | `bcryptjs` with salt rounds 10. Passwords never saved or logged in plaintext. | **SECURE** |
| **Authentication** | JWT Signature Verification | HMAC-SHA256 signing using `JWT_SECRET`. Tokens expire in 7 days (`JWT_EXPIRES_IN`). | **SECURE** |
| **Authorization** | Role-Based Access Control | `requireRole('STUDENT')`, `requireRole('RECRUITER')`, `requireRole('UNIVERSITY_ADMIN')`. | **SECURE** |
| **Authorization** | Resource Ownership Isolation | Recruiters can only access and modify their own jobs (`job.postedBy === req.user.id`). | **SECURE** |
| **Authorization** | Student Application Isolation | Students can only inspect their own applications (`studentId: req.user.id`). | **SECURE** |
| **Authorization** | Recruiter Applicant Isolation | Recruiters can only inspect applicants for jobs they personally created. | **SECURE** |
| **Data Integrity** | Duplicate Application Guard | MongoDB compound unique index `{ studentId: 1, jobId: 1 }` rejects duplicates with HTTP 409. | **SECURE** |
| **Governance** | Company Accreditation Gate | Unverified recruiters are forbidden from publishing postings (`company.verified === true`). | **SECURE** |
| **Privacy** | In-App Notification Isolation | Queries filter strictly by `{ $or: [{ recipient: req.user.id }, { recipientId: req.user.id }] }`. Cross-user inspection yields HTTP 404. | **SECURE** |
| **Infrastructure** | HTTP Security Headers | `helmet()` active, enforcing X-Content-Type-Options, X-Frame-Options, DNS prefetch controls. | **SECURE** |
| **Infrastructure** | Rate Limiting | `express-rate-limit` active on all API routes to mitigate brute force attempts. | **SECURE** |
| **Infrastructure** | CORS Restrictions | Controlled CORS allowing requests from `process.env.CLIENT_URL` with credentials support. | **SECURE** |
| **AI Processing** | PyMuPDF Sandbox Safety | PDF parsing runs inside memory stream buffers with size validation. No shell execution. | **SECURE** |
| **AI Reliability** | Deterministic Skill Extraction | Rule-based normalized taxonomy regex prevents LLM hallucination and fabricated evidence. | **SECURE** |

---

## 3. Vulnerability Findings & Mitigations

1. **New Account Resume Skill Synchronization Schema Defaults:**
   - *Threat:* Failure to complete mandatory academic profile fields prior to importing resume skills could cause database crashes or schema bypasses.
   - *Mitigation:* Configured resilient schema defaults in `StudentProfile.js` allowing seamless resume skill ingestion without compromising database integrity.
2. **Notification ID Existence Probing:**
   - *Threat:* An attacker attempting to delete or mark as read an arbitrary notification ID might deduce its existence if the server returned HTTP 403 Forbidden.
   - *Mitigation:* Returns HTTP 404 Not Found on cross-user operations, leaking zero structural metadata regarding other users' notifications.
3. **Company Verification Tampering:**
   - *Threat:* Recruiter attempting to self-verify company by injecting `{ verified: true }` in `PUT /companies/profile`.
   - *Mitigation:* The `updateMyCompanyProfile` controller strictly ignores the `verified` field; verification transitions can only be triggered via `PATCH /admin/companies/:id/verify` guarded by `UNIVERSITY_ADMIN` authentication.

4. **Admin Privilege Escalation via Public Registration:**
   - *Threat:* The public registration API endpoint previously allowed the user to specify `role: 'UNIVERSITY_ADMIN'`, enabling any visitor or automated script to create an administrator account.
   - *Mitigation:*
     - Restricted public registration strictly to `STUDENT` and `RECRUITER`.
     - Explicit backend validation in `authController.js` rejecting `UNIVERSITY_ADMIN`, `ADMIN`, non-string payloads, and unknown roles with HTTP 400.
     - Removed the administrator option from the public registration UI in `frontend/src/pages/auth/Register.jsx`.
     - Implemented local, CLI-only administrator provisioning via `backend/scripts/provisionAdmin.js` using `bcryptjs` salted password hashing with hidden interactive CLI prompt or environment variables. No public administrative registration endpoint exists.
     - Automated regression verified via `backend/tests/security_admin_privilege_suite.js` (13/13 passing tests).

---

## 4. Git Hygiene & Secret Management
- `.gitignore` properly excludes `.env`, `node_modules`, `build`, `dist`, `.venv`, and `__pycache__`.
- Zero actual secrets, private keys, or credentials committed in Git history.

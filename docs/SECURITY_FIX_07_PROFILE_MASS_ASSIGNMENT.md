# Security Fix 07: Student Profile Mass Assignment & Server-Controlled Fields Protection

**Severity:** P0 — Data Integrity, Authorization, and Privilege Protection  
**Service:** Node.js Express Backend (`backend/src/controllers/studentController.js`)  
**Date:** November 17, 2026  
**Status:** Remediated & Fully Verified  

---

## 1. Executive Summary

Prior to this fix, `PUT /api/v1/students/profile` in `backend/src/controllers/studentController.js` stripped only `userId` via object destructuring (`const { userId: _, ...bodyData } = req.body;`) and passed the rest of the unvalidated object directly to Mongoose via `StudentProfile.findOneAndUpdate({ userId }, { $set: updateData })`.

This created a severe Mass Assignment vulnerability:
1. **Server-Controlled Fields Injection:** An authenticated student could inject arbitrary database properties, including `verified`, `verifiedAt`, `accountStatus`, `resumeId`, `resumeUrl`, and internal system metadata.
2. **Skill Provenance Forgery:** A student could self-grant `assessment_verified` or forge `resume_extracted` status for skills without undergoing an actual assessment or resume parsing pipeline.
3. **Prototype Pollution & Operator Injection:** Unrestricted object keys permitted MongoDB operator injection (`$set`, `$inc`) and potential prototype pollution via payload properties.
4. **Lack of Strict Boundary Validation:** CGPA, graduation years, URLs, and array lengths lacked schema validation on update.

---

## 2. Field-Level Authorization Matrix

| Field | Allowed on Self-Service PUT? | Controlled By | Validation Rules |
| :--- | :---: | :--- | :--- |
| `bio` | **YES** | Student | String <= 500 chars, trimmed |
| `phone` | **YES** | Student | String <= 30 chars, trimmed |
| `university` | **YES** | Student | String <= 500 chars, trimmed |
| `degree` | **YES** | Student | String <= 500 chars, trimmed |
| `branch` | **YES** | Student | String <= 500 chars, trimmed |
| `graduationYear` | **YES** | Student | Integer, 2000 to 2040 |
| `cgpa` | **YES** | Student | Float, 0.00 to 10.00 |
| `careerGoal` | **YES** | Student | String <= 500 chars, trimmed |
| `skills` (name, level) | **YES** | Student | Array <= 100 items; name <= 100 chars; level enum |
| `skills.source` | **NO** | Server / Pipeline | Set to `self_reported`; preserved if `resume_extracted` or `assessment_verified` |
| `skills.verifiedAt` | **NO** | Assessment Service | Only set by assessment engine, preserved across edits |
| `projects` | **YES** | Student | Array <= 30 items; validated title, URLs |
| `certifications` | **YES** | Student | Array <= 30 items; validated title, issuer, URLs |
| `experience` | **YES** | Student | Array <= 30 items; validated title, company |
| `githubUrl` | **YES** | Student | Valid HTTP/HTTPS URL |
| `linkedinUrl` | **YES** | Student | Valid HTTP/HTTPS URL |
| `userId` | **NO** | Server (JWT) | Immutable. Derived strictly from `req.user.id` |
| `role` | **NO** | Admin / Registration | Student cannot elevate role |
| `verified` / `verifiedAt`| **NO** | University Admin | Cannot be self-granted |
| `resumeId` / `resumeUrl` | **NO** | Resume Upload Service | Written exclusively by authenticated resume upload |
| `readinessScore` | **NO** | AI Service | Generated dynamically / by career engine |

---

## 3. Implementation Details

1. **Explicit Field Allowlist:** `ALLOWED_STUDENT_UPDATE_FIELDS` contains only student-editable profile attributes.
2. **Server-Controlled Protection:** `SERVER_CONTROLLED_FIELDS` explicitly blocks manipulation of system attributes.
3. **Operator & Pollution Guard:** Keys starting with `$` or containing `.`, `__proto__`, `constructor`, or `prototype` are rejected immediately with `HTTP 400 Bad Request`.
4. **Skill Provenance Preservation:** In `validateAndFilterProfilePayload`, any skill submitted with a spoofed `source` (e.g. `assessment_verified`) is forced to `self_reported`. If the student already possessed a verified skill or resume-extracted skill in the database, its provenance and `verifiedAt` timestamp are preserved.
5. **Resume & AI Skill Synchronization:** The trusted route `POST /api/v1/students/profile/sync-resume-skills` remains dedicated to atomic merging of resume-extracted skills with `source: 'resume_extracted'`.

---

## 4. Automated Security Suite Results

Dedicated Suite: [`backend/tests/security_profile_mass_assignment_suite.js`](file:///c:/Users/Lenovo/Desktop/Djano/backend/tests/security_profile_mass_assignment_suite.js)  
Test cases covered:
1. Student can update allowed personal profile fields (HTTP 200).
2. Student cannot update or reassign `userId` via request body mass assignment.
3. Student cannot update or elevate `role` via profile update.
4. Student cannot inject server-controlled `verified` or `accountStatus` properties.
5. Student cannot inject server-controlled `verifiedAt` timestamp.
6. Student cannot forge `resumeId` or `resumeUrl` via self-service PUT.
7. Student cannot self-grant `assessment_verified` or forge verification timestamp on skills.
8. Trusted `resume_extracted` skill source is preserved during subsequent profile updates.
9. Student 2 update only modifies Student 2 document, never Student 1 (strictly bound to auth `user.id`).
10. Recruiter cannot update student profile (HTTP 403 Forbidden).
11. Recruiter `GET /students/profile` is rejected (HTTP 403 Forbidden).
12. Unknown fields (`isAdmin`, `hackerFlag`, `superUser`) are safely stripped and not persisted.
13. MongoDB operator injection (`$set`) and prototype pollution are rejected with HTTP 400.
14. Invalid CGPA (> 10 or < 0) is rejected with HTTP 400.
15. Invalid graduation year (< 2000 or > 2040) is rejected with HTTP 400.
16. Invalid URL value (e.g. `javascript:`) is rejected with HTTP 400.
17. Complex profile updates with projects, certifications, and experience succeed cleanly.
18. Resume/AI skill synchronization continues working through trusted backend endpoint.

**Result:** **21 Passed, 0 Failed.**

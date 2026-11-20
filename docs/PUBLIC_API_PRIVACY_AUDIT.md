# PUBLIC API PRIVACY & DATA EXPOSURE AUDIT

**Project:** SkillBridge AI (SIH Problem Statement: SIH26044)  
**Date:** 2026-11-18  
**Role:** Senior Application Security Engineer & API Privacy Architect  

---

## 1. Inventory of Endpoints

| HTTP Method | Route | Auth Required | Allowed Roles | Data Returned | Sensitive Fields Detected | Ownership Requirements | Current Privacy / Query Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/jobs` | Optional | Public / All | Array of Jobs, total count | Recruiter `postedBy` (if populated), unverified company details | None for public; `postedBy` for `myJobs=true` | **HIGH**: Unbounded query without max limit, unescaped `$regex` in `search`, `location`, `skills`, potential personal email exposure |
| **GET** | `/api/v1/jobs/:id` | Optional | Public / All | Single Job document | Populates `postedBy: name, email`! | None for public; verification check exists | **CRITICAL**: Exposes recruiter personal email & name to unauthenticated public visitors |
| **POST** | `/api/v1/jobs` | Required | `RECRUITER` | Created Job document | Internal IDs | Recruiter owns company | Safe |
| **PUT** | `/api/v1/jobs/:id` | Required | `RECRUITER` | Updated Job document | Internal IDs | Recruiter is `postedBy` | Safe |
| **PATCH** | `/api/v1/jobs/:id/status` | Required | `RECRUITER` | Updated Job document | Internal IDs | Recruiter is `postedBy` | Safe |
| **DELETE** | `/api/v1/jobs/:id` | Required | `RECRUITER` | Success message | None | Recruiter is `postedBy` | Safe |
| **GET** | `/api/v1/jobs/:id/match` | Required | `STUDENT` | Match score, missing skills | None | Student JWT | Safe |
| **GET** | `/api/v1/jobs/:id/applications` | Required | `RECRUITER` | Applications for job | Student `name, email` | Recruiter is `postedBy` | Application PII (legitimate for recruiter) |
| **GET** | `/api/v1/companies/profile` | Required | `RECRUITER` | Recruiter's own company | Contact phone, email | Recruiter owns company | Safe (private to owner) |
| **PUT** | `/api/v1/companies/profile` | Required | `RECRUITER` | Updated company | Contact phone, email | Recruiter owns company | Safe |
| **GET** | `/api/v1/companies/:id` | None / Public | Public / All | Company document | Populates `recruiterUserId: name, email`, exposes `contactEmail`, `contactPhone`, `verified` | None | **CRITICAL**: Leaks recruiter personal name, email, and unredacted direct contact phone to unauthenticated public callers |
| **GET** | `/api/v1/students/profile` | Required | `STUDENT`, `UNIVERSITY_ADMIN` | Student profile | Phone, bio, CGPA, resume URL | Student (own) or Admin | Admin cross-university tenancy restriction needed if admin has university |
| **PUT** | `/api/v1/students/profile` | Required | `STUDENT` | Updated profile | Phone, bio, CGPA | Student (own) | Protected by allowlist |
| **GET** | `/api/v1/students/profile/completion` | Required | `STUDENT` | Completion breakdown | None | Student (own) | Safe |
| **POST** | `/api/v1/students/profile/sync-resume-skills` | Required | `STUDENT` | Synced skills | None | Student (own) | Safe |
| **POST** | `/api/v1/students/resume` | Required | `STUDENT` | Resume metadata | Storage key (redacted), checksum | Student (own) | Safe |
| **GET** | `/api/v1/students/resume` | Required | `STUDENT` | Active & history resumes | Download URLs | Student (own) | Safe |
| **GET** | `/api/v1/students/resume/:id/download` | Required | `STUDENT`, `RECRUITER`, `UNIVERSITY_ADMIN` | Binary PDF stream | Resume document & PII | Strict ownership / consent | Remediated in Prompt 9.1 |
| **DELETE** | `/api/v1/students/resume/:id` | Required | `STUDENT` | Success message | None | Student (own) | Safe |
| **POST** | `/api/v1/applications` | Required | `STUDENT` | Application document | Match score | Student (own) | Safe |
| **GET** | `/api/v1/applications/my` | Required | `STUDENT` | Applications list | Job info, status | Student (own) | Safe |
| **PATCH** | `/api/v1/applications/:id/status`| Required | `RECRUITER` | Updated application | Application status | Recruiter posted job | Safe |
| **GET** | `/api/v1/admin/stats` | Required | `UNIVERSITY_ADMIN` | Platform metrics | None | Admin role | Safe |
| **GET** | `/api/v1/admin/students` | Required | `UNIVERSITY_ADMIN` | Student directory | Name, email, CGPA, skills | Admin role | Needs bounded pagination & regex sanitization |
| **GET** | `/api/v1/admin/companies` | Required | `UNIVERSITY_ADMIN` | Companies list | Verification status | Admin role | Needs pagination bounds |
| **PATCH** | `/api/v1/admin/companies/:id/verify` | Required | `UNIVERSITY_ADMIN` | Updated company | Verification status | Admin role | Strict verification policy applied |
| **GET** | `/api/v1/admin/curriculum-gap` | Required | `UNIVERSITY_ADMIN` | Heatmap data | None | Admin role | Safe |
| **GET** | `/api/v1/admin/industry-skill-demand`| Required | `UNIVERSITY_ADMIN` | Skill demand aggregation | None | Admin role | Safe |
| **GET** | `/api/v1/admin/industry-partners` | Required | `UNIVERSITY_ADMIN` | Partner companies | Verified companies | Admin role | Safe |
| **GET** | `/api/v1/admin/internships` | Required | `UNIVERSITY_ADMIN` | Internships with counts | Applicant counts | Admin role | Safe |
| **GET** | `/api/v1/notifications` | Required | All authenticated | Notification items | User notification text | User owns notifications | Has pagination (page, limit) |
| **GET** | `/api/v1/notifications/unread-count`| Required | All authenticated | Count number | None | User owns notifications | Safe |

---

## 2. Key Privacy Risks Identified

1. **Recruiter Personal PII Exposure in `GET /api/v1/jobs/:id`:**
   - Currently: `.populate('postedBy', 'name email')` attaches the private `email` and `name` of the recruiter to the public job response!
   - Risk: Harvesting recruiter personal emails for phishing, spam, or competitive targeting.
   - Fix: Public view must never serialize `postedBy` personal email. Only approved public `companyId` details (name, website, industry, location, logo) should be included. If recruiter is viewing their own job or an admin is auditing, `postedBy` is preserved.

2. **Personal Contact Exposure in `GET /api/v1/companies/:id`:**
   - Currently: Returns the raw Company document and `.populate('recruiterUserId', 'name email')`.
   - Risk: Direct disclosure of recruiter personal user account info and unverified internal phone/email.
   - Fix: Implement `serializePublicCompany(company)` which excludes `recruiterUserId`, internal flags, and only exposes public branding/website/location.

3. **Query Injection and ReDoS:**
   - Currently: `new RegExp(req.query.search, 'i')` directly evaluates unescaped user strings.
   - Risk: Supplying metacharacters like `((((a+)+)+)+)` can lock up Node's event loop (ReDoS). Supplying MongoDB query objects via query parsers (e.g. `search[$ne]=1`) can bypass expected string typing.
   - Fix: Build a robust `sanitizeRegex(input)` utility that strictly validates string type, trims length to a max ceiling (e.g. 100 chars), escapes all regex metacharacters (`[-[\]{}()*+?.,\\^$|#\s]`), and rejects object-injection payloads.

4. **Unbounded Queries and Missing Pagination Ceiling:**
   - In `getJobs`, `Job.find(filter)` has NO `.limit()` or pagination applied! An attacker or crawler can request all thousands of jobs at once.
   - Fix: Enforce standard pagination with `page = 1`, `limit = 10`, `maxLimit = 50`, and return standardized pagination metadata `{ page, limit, total, totalPages }`.

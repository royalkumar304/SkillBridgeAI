# SkillBridge AI — Final API Reference

**Base URL:** `http://localhost:5001/api/v1`  
**Authentication:** HttpOnly Cookie (`skillbridge_token`) or `Authorization: Bearer <JWT>`  
**CSRF:** Non-safe requests (`POST`, `PUT`, `PATCH`, `DELETE`) with cookies require `x-csrf-token` header matching `XSRF-TOKEN` cookie.

---

## 1. Authentication (`/auth`)
* `GET /auth/csrf-token` — Returns a freshly signed CSRF token and sets readable `XSRF-TOKEN` cookie.
* `POST /auth/register` — Public registration for `STUDENT` or `RECRUITER` (Admin roles strictly rejected with 400).
* `POST /auth/login` — Authenticates user, sets HttpOnly cookie, returns user details and token.
* `GET /auth/me` — Hydrates current session from cookie/Bearer. Validates `tokenVersion` and status.
* `POST /auth/logout` — Atomically increments database `tokenVersion` and clears authentication cookies.

## 2. Student & Resumes (`/students`)
* `GET /students/profile` — Retrieves authenticated student's profile.
* `PUT /students/profile` — Updates personal profile (mass-assignment protected; strips server-controlled fields).
* `POST /students/resume` — Uploads PDF resume (enforces 5MB limit, %PDF- magic bytes, extracts skills via AI).
* `GET /students/resume` — Lists student's resume upload history.
* `GET /students/resume/:id/download` — Downloads resume binary (strictly enforced role & applicant consent checks).
* `DELETE /students/resume/:id` — Deletes resume record and physical file; rolls over active resume reference.

## 3. Jobs & Internships (`/jobs`)
* `GET /jobs` — Discovers active published jobs and internships (filters unverified/revoked companies).
* `GET /jobs/:id` — Retrieves detailed job specifications.
* `POST /jobs` — Recruiter creates job/internship (enforces verified company status).
* `PUT /jobs/:id` — Recruiter updates own job.
* `DELETE /jobs/:id` — Recruiter deletes own job.
* `GET /jobs/:id/applications` — Recruiter views candidate applications for own job.

## 4. Applications (`/applications`)
* `POST /applications` — Student submits application (enforces compound uniqueness; duplicate returns 409).
* `GET /applications/my` — Student views their own submitted applications and live statuses.
* `PATCH /applications/:id/status` — Recruiter updates candidate application status (triggers real-time notification).

## 5. Career Intelligence (`/career`)
* `GET /career/readiness` — Returns authoritative calculated readiness score (Academic, Practical, Skill Match).
* `POST /career/gap` — Evaluates skill gaps between student profile and target industry role.
* `GET /career/recommendations` — Dynamic learning recommendations based on identified gaps.
* `GET /career/jobs-analysis` — Multi-job readiness matrix.

## 6. University Administration (`/admin`)
* `GET /admin/stats` — High-level university platform metrics.
* `GET /admin/students` — University-scoped student roster and readiness aggregates.
* `GET /admin/companies` — Recruiter companies directory awaiting verification.
* `PATCH /admin/companies/:id/verify` — Admin approves, rejects, or revokes company credentials.
* `GET /admin/curriculum-insights` — Skill demand vs curriculum alignment data.

## 7. Notifications (`/notifications`)
* `GET /notifications` — Fetches authenticated user's notifications.
* `PATCH /notifications/:id/read` — Marks single notification as read.
* `PATCH /notifications/read-all` — Marks all notifications as read.
* `DELETE /notifications/:id` — Deletes notification.

## 8. Service Health & Readiness (`/`)
* `GET /health` — Liveness probe (reports process UP).
* `GET /ready` — Readiness probe (validates MongoDB connection and bounded AI microservice health).

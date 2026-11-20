# SkillBridge AI — Final Release File Allowlist & Staging Guide (Prompt 12.1 Verified)

**Date & Local Timestamp:** 2026-11-20T01:25:47+05:30  
**Git Branch:** `feat/day-4-career-intelligence`  
**Total Tracked Modified Files:** 47  
**Total Untracked Files:** 116  

---

## 1. FILE-BY-FILE CLASSIFICATION MATRIX

Every file in the working tree has been audited individually to prevent accidental staging of sensitive material, local credentials, or generated files.

### Category A: SAFE_TO_STAGE (Reviewed Application Source, Tests & Specs)

#### 1. Root Configuration, CI & Monorepo Manifests:
* `SAFE_TO_STAGE`: `.github/workflows/ci.yml` (Tracked CI pipeline; 4 jobs, zero hardcoded secrets)
* `SAFE_TO_STAGE`: `docker-compose.yml` (Multi-container orchestration for backend, frontend, AI, MongoDB)
* `SAFE_TO_STAGE`: `.gitignore` (Configured exclusions for `.env`, `*.pdf`, `node_modules`, `dist/`, `venv/`)
* `SAFE_TO_STAGE`: `.env.production.example` (Production configuration template with explicit placeholders only)
* `SAFE_TO_STAGE`: `README.md` (Monorepo setup and architecture guide)
* `SAFE_TO_STAGE`: `package-lock.json` (Root workspace lockfile with 0 production vulnerabilities)

#### 2. Backend Server & Architecture:
* `SAFE_TO_STAGE`: `backend/package.json` (Dependencies and test scripts)
* `SAFE_TO_STAGE`: `backend/server.js` (Express startup with fail-fast DB listener and graceful shutdown)
* `SAFE_TO_STAGE`: `backend/Dockerfile` (Multi-stage Node.js 20 runner with non-root user `appuser`)
* `SAFE_TO_STAGE`: `backend/.dockerignore` (Excludes `.env`, `storage/resumes`, `tests`, `node_modules`)
* `SAFE_TO_STAGE`: `backend/.env.example` (Development template with placeholder strings)
* `SAFE_TO_STAGE`: `backend/src/app.js` (Express app middleware, CSRF validation, and route mounts)
* `SAFE_TO_STAGE`: `backend/src/config/cookie.js` (HttpOnly cookie configuration and path scoping)
* `SAFE_TO_STAGE`: `backend/src/config/csrf.js` (Cryptographic key separation for CSRF signing)
* `SAFE_TO_STAGE`: `backend/src/config/db.js` (MongoDB lifecycle listeners, graceful shutdown, readiness state)
* `SAFE_TO_STAGE`: `backend/src/config/jwt.js` (Fail-closed JWT secret validation and HS256 claims)
* `SAFE_TO_STAGE`: `backend/src/controllers/adminController.js` (University admin metrics and roster)
* `SAFE_TO_STAGE`: `backend/src/controllers/applicationController.js` (Job application submission and status updates)
* `SAFE_TO_STAGE`: `backend/src/controllers/authController.js` (Registration, login, getMe, logout with cookie clearing)
* `SAFE_TO_STAGE`: `backend/src/controllers/careerIntelligenceController.js` (Readiness calculation and gap analysis)
* `SAFE_TO_STAGE`: `backend/src/controllers/companyController.js` (Recruiter company profiles)
* `SAFE_TO_STAGE`: `backend/src/controllers/healthController.js` (Liveness /health and bounded readiness /ready)
* `SAFE_TO_STAGE`: `backend/src/controllers/jobController.js` (Job and internship CRUD with verification checks)
* `SAFE_TO_STAGE`: `backend/src/controllers/notificationController.js` (In-app notifications and read tracking)
* `SAFE_TO_STAGE`: `backend/src/controllers/resumeController.js` (PDF resume upload, history, download, deletion)
* `SAFE_TO_STAGE`: `backend/src/controllers/studentController.js` (Student profile management with mass-assignment defense)
* `SAFE_TO_STAGE`: `backend/src/middleware/authMiddleware.js` (JWT cookie verification and database tokenVersion checks)
* `SAFE_TO_STAGE`: `backend/src/middleware/csrfMiddleware.js` (Double-submit HMAC-SHA256 CSRF verification)
* `SAFE_TO_STAGE`: `backend/src/middleware/rateLimiter.js` (Express rate limiting with test environment bypass)
* `SAFE_TO_STAGE`: `backend/src/models/Company.js` (Company model with verification synchronization hooks)
* `SAFE_TO_STAGE`: `backend/src/models/Job.js` (Job schema supporting full-time and internships)
* `SAFE_TO_STAGE`: `backend/src/models/Notification.js` (Notification schema with recipient indexing)
* `SAFE_TO_STAGE`: `backend/src/models/Resume.js` (Resume metadata with UUID storage keys and SHA-256 checksums)
* `SAFE_TO_STAGE`: `backend/src/models/StudentProfile.js` (Profile model with skill provenance tracking)
* `SAFE_TO_STAGE`: `backend/src/models/User.js` (User model with tokenVersion and status enums)
* `SAFE_TO_STAGE`: `backend/src/routes/adminRoutes.js` (Protected university administrator routes)
* `SAFE_TO_STAGE`: `backend/src/routes/applicationRoutes.js` (Application routes with compound uniqueness)
* `SAFE_TO_STAGE`: `backend/src/routes/authRoutes.js` (Public authentication routes and CSRF issuance)
* `SAFE_TO_STAGE`: `backend/src/routes/companyRoutes.js` (Company management routes)
* `SAFE_TO_STAGE`: `backend/src/routes/healthRoutes.js` (Health and readiness routes)
* `SAFE_TO_STAGE`: `backend/src/routes/jobRoutes.js` (Job and internship discovery routes)
* `SAFE_TO_STAGE`: `backend/src/routes/notificationRoutes.js` (Notification endpoints)
* `SAFE_TO_STAGE`: `backend/src/routes/studentRoutes.js` (Student profile and resume routes)
* `SAFE_TO_STAGE`: `backend/src/services/aiClientService.js` (Internal HTTP client for FastAPI AI microservice)
* `SAFE_TO_STAGE`: `backend/src/services/notificationService.js` (Notification dispatching service)
* `SAFE_TO_STAGE`: `backend/src/services/storageService.js` (Local storage driver with UUID filename randomization)
* `SAFE_TO_STAGE`: `backend/src/utils/multipartParser.js` (Streaming multipart form-data parser)
* `SAFE_TO_STAGE`: `backend/src/utils/querySanitizer.js` (NoSQL injection and regex denial-of-service sanitizer)
* `SAFE_TO_STAGE`: `backend/src/utils/readinessCalculator.js` (Deterministic multi-factor career readiness engine)
* `SAFE_TO_STAGE`: `backend/src/utils/responseSerializers.js` (Public data serializers stripping PII and storage keys)
* `SAFE_TO_STAGE`: `backend/src/utils/skillTaxonomy.js` (Standardized technical skill classification dictionary)
* `SAFE_TO_STAGE`: `backend/src/utils/verificationPolicy.js` (Company approval gate logic)
* `SAFE_TO_STAGE`: `backend/scripts/provisionAdmin.js` (CLI utility to securely provision university admin accounts)

#### 3. Backend Automated Regression Suites:
* `SAFE_TO_STAGE`: `backend/tests/runAllTests.js` (Central test runner orchestrating all 24 suites)
* `SAFE_TO_STAGE`: `backend/tests/auth_ownership_suite.js` (Role-based access and ownership tests)
* `SAFE_TO_STAGE`: `backend/tests/day3_suite.js` (Core workflow, job matching, and duplicate application tests)
* `SAFE_TO_STAGE`: `backend/tests/day4_career_suite.js` (Career intelligence and readiness tests)
* `SAFE_TO_STAGE`: `backend/tests/day5_admin_suite.js` (Admin governance and company verification tests)
* `SAFE_TO_STAGE`: `backend/tests/day5_notification_suite.js` (In-app notification tests)
* `SAFE_TO_STAGE`: `backend/tests/day6_internship_suite.js` (Internship management tests)
* `SAFE_TO_STAGE`: `backend/tests/regression_suite.js` (Multi-tier regression suite)
* `SAFE_TO_STAGE`: `backend/tests/security_admin_privilege_suite.js` (Admin registration escalation prevention tests)
* `SAFE_TO_STAGE`: `backend/tests/security_ai_service_auth_suite.js` (AI service internal auth and CORS tests)
* `SAFE_TO_STAGE`: `backend/tests/security_auth_final_gate_suite.js` (Final authentication and tokenVersion security tests)
* `SAFE_TO_STAGE`: `backend/tests/security_company_verification_suite.js` (Company verification lifecycle tests)
* `SAFE_TO_STAGE`: `backend/tests/security_cookie_auth_suite.js` (HttpOnly cookie authentication tests)
* `SAFE_TO_STAGE`: `backend/tests/security_cookie_deep_audit_suite.js` (Cookie flag and session refresh tests)
* `SAFE_TO_STAGE`: `backend/tests/security_csrf_deep_audit_suite.js` (CSRF HMAC signature tests)
* `SAFE_TO_STAGE`: `backend/tests/security_csrf_suite.js` (Double-submit CSRF tests)
* `SAFE_TO_STAGE`: `backend/tests/security_dashboard_data_integrity_suite.js` (Readiness calculation integrity tests)
* `SAFE_TO_STAGE`: `backend/tests/security_database_reliability_suite.js` (Fail-fast MongoDB and readiness tests)
* `SAFE_TO_STAGE`: `backend/tests/security_jwt_suite.js` (JWT secret validation and HS256 claim tests)
* `SAFE_TO_STAGE`: `backend/tests/security_logout_revocation_suite.js` (Logout revocation tests)
* `SAFE_TO_STAGE`: `backend/tests/security_multisession_logout_suite.js` (Multi-device logout policy tests)
* `SAFE_TO_STAGE`: `backend/tests/security_profile_mass_assignment_suite.js` (Mass-assignment protection tests)
* `SAFE_TO_STAGE`: `backend/tests/security_public_api_privacy_suite.js` (Public API privacy and NoSQL injection tests)
* `SAFE_TO_STAGE`: `backend/tests/security_recruiter_ownership_suite.js` (Recruiter ownership tests)
* `SAFE_TO_STAGE`: `backend/tests/security_resume_persistence_suite.js` (Resume upload, storage, and download tests)
* `SAFE_TO_STAGE`: `backend/tests/security_session_suite.js` (Session management and RBAC tests)

#### 4. Python FastAPI AI Microservice & Tests:
* `SAFE_TO_STAGE`: `ai-service/app/main.py` (FastAPI app, CORS configuration, internal auth dependency)
* `SAFE_TO_STAGE`: `ai-service/app/dependencies.py` (Mutual internal service key verification)
* `SAFE_TO_STAGE`: `ai-service/app/routes/skills.py` (Resume extraction and job matching endpoints)
* `SAFE_TO_STAGE`: `ai-service/app/schemas/skill_schemas.py` (Pydantic request/response schemas)
* `SAFE_TO_STAGE`: `ai-service/app/services/` (PyMuPDF parser, skill extractor, vector matcher)
* `SAFE_TO_STAGE`: `ai-service/Dockerfile` (Multi-stage Python 3.11 image with non-root user `appuser`)
* `SAFE_TO_STAGE`: `ai-service/.dockerignore` (Excludes `.env`, `venv`, `__pycache__`)
* `SAFE_TO_STAGE`: `ai-service/.env.example` (FastAPI configuration template with placeholders)
* `SAFE_TO_STAGE`: `ai-service/tests/test_fallback_integrity.py` (Unit tests for career readiness fallbacks)
* `SAFE_TO_STAGE`: `ai-service/tests/test_service_auth.py` (Unit tests for internal key verification)

#### 5. Frontend Client & Navigation Tests:
* `SAFE_TO_STAGE`: `frontend/package.json` (Dependencies with `react-router-dom@7.18.6`)
* `SAFE_TO_STAGE`: `frontend/Dockerfile` (Multi-stage build served via production Alpine NGINX)
* `SAFE_TO_STAGE`: `frontend/.dockerignore` (Excludes `node_modules`, `dist`, `.env`)
* `SAFE_TO_STAGE`: `frontend/nginx.conf` (NGINX configuration with gzip and client-side routing fallback)
* `SAFE_TO_STAGE`: `frontend/src/App.jsx` (Application router preserving all 15 role-protected routes)
* `SAFE_TO_STAGE`: `frontend/src/services/api.js` (Centralized Axios client with automatic CSRF token attachment)
* `SAFE_TO_STAGE`: `frontend/src/context/AuthContext.jsx` (Authentication state manager with session hydration)
* `SAFE_TO_STAGE`: `frontend/src/utils/safeRedirect.js` (Safe URL sanitization rejecting open redirects)
* `SAFE_TO_STAGE`: `frontend/tests/navigation_security_test.js` (Unit test suite for navigation redirect security)
* `SAFE_TO_STAGE`: `frontend/src/components/` (UI components, ProtectedRoute, Navbar, Dropdowns)
* `SAFE_TO_STAGE`: `frontend/src/pages/` (Student, Recruiter, Admin, and Auth pages)
* `SAFE_TO_STAGE`: `frontend/src/layouts/` (StudentLayout, RecruiterLayout, AdminLayout)

#### 6. Architecture & Release Documentation:
* `SAFE_TO_STAGE`: `docs/FINAL_PROJECT_ARCHITECTURE.md`
* `SAFE_TO_STAGE`: `docs/FINAL_DATABASE_SCHEMA.md`
* `SAFE_TO_STAGE`: `docs/FINAL_API_REFERENCE.md`
* `SAFE_TO_STAGE`: `docs/SIH_DEMO_SCRIPT.md`
* `SAFE_TO_STAGE`: `docs/SIH_EVALUATION_READINESS.md`
* `SAFE_TO_STAGE`: `docs/PROMPT_12_0_MASTER_FINALIZATION_REPORT.md`
* `SAFE_TO_STAGE`: `docs/PROMPT_12_1_FINAL_RELEASE_CLOSURE_REPORT.md`

---

### Category B: EXCLUDE_SENSITIVE (Never Stage)
* `EXCLUDE_SENSITIVE`: `.env`, `backend/.env`, `frontend/.env`, `ai-service/.env` (Live local credentials)
* `EXCLUDE_SENSITIVE`: `backend/storage/resumes/*.pdf` (User-uploaded private resume files)

### Category C: EXCLUDE_GENERATED (Ignore Build & Cache Artifacts)
* `EXCLUDE_GENERATED`: `node_modules/`, `backend/node_modules/`, `frontend/node_modules/`
* `EXCLUDE_GENERATED`: `frontend/dist/`
* `EXCLUDE_GENERATED`: `ai-service/venv/`, `ai-service/__pycache__/`, `ai-service/tests/__pycache__/`
* `EXCLUDE_GENERATED`: `audit_results.json`, `backend/audit_results.json`

### Category D: NOT_REQUIRED (Local Convenience Scripts)
* `NOT_REQUIRED`: `run_project.bat` (Local development convenience launcher for Windows)
* `NOT_REQUIRED`: `backend/tests/manual_integration_audit.js` (Ad-hoc developer script)
* `NOT_REQUIRED`: `backend/tests/test_pdf_upload.js` (Ad-hoc developer script)

---

## 2. Recommended Safe Staging Commands (For User Execution)

```powershell
# 1. Monorepo Configuration, CI & README
git add .github/workflows/ci.yml docker-compose.yml .gitignore .env.production.example README.md package-lock.json

# 2. Backend Gateway, Controllers & Tests
git add backend/package.json backend/server.js backend/Dockerfile backend/.dockerignore backend/.env.example
git add backend/src/ backend/tests/ backend/scripts/

# 3. AI Service & Tests
git add ai-service/Dockerfile ai-service/.dockerignore ai-service/.env.example ai-service/app/ ai-service/tests/

# 4. Frontend Client & Navigation Tests
git add frontend/package.json frontend/Dockerfile frontend/.dockerignore frontend/nginx.conf frontend/.env.example
git add frontend/src/ frontend/tests/

# 5. Architecture & Evaluation Documentation
git add docs/

# 6. Verify Staged Tree (Should contain 0 secrets, 0 PDFs, 0 dist files)
git status --short
```

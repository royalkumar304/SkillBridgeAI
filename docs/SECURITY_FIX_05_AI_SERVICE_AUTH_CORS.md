# Security Fix 05: AI Microservice Authentication & CORS Hardening

**Severity:** P0 — Critical  
**Service:** Python FastAPI AI Microservice (`ai-service` on port 8000) & Node.js Backend Integration (`backend` on port 5001)  
**Date:** November 17, 2026  
**Status:** Remediated & Fully Verified  

---

## 1. Executive Summary

Prior to this fix, the SkillBridge AI Python microservice (`ai-service` running on port 8000) was exposed without service-to-service authentication and utilized overly permissive wildcard CORS (`allow_origins=["*"]`) combined with `allow_credentials=True`. This permitted unauthenticated actors and arbitrary third-party websites in a browser context to query internal AI algorithms (`/extract-skills`, `/analyze-skill-gap`, `/match-jobs`, `/career-intelligence/*`), abuse computational resources, and execute denial-of-service or data extraction attacks.

### Remediation Overview:
1. **Service-to-Service Authentication:** Implemented constant-time key validation (`hmac.compare_digest`) via dependency injection requiring the `X-Internal-Service-Key` header on all protected AI processing routes.
2. **Fail-Safe Startup Verification:** If `INTERNAL_SERVICE_KEY` is missing or shorter than 32 characters, the AI service fails closed.
3. **Internal Caller Hardening:** Updated Node.js `AIClientService` to automatically pass `X-Internal-Service-Key` across all outgoing calls.
4. **CORS Hardening:** Removed wildcard origin reflection. Implemented strict environment-based whitelist (`ALLOWED_ORIGINS`) allowing only legitimate local origins (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:5001`) with explicit allowed methods and headers.
5. **Upload & Input Validation:** Hardened PDF document upload (`/upload-resume-pdf`) with strict 5MB upload ceilings, MIME type validation (`application/pdf`), non-empty buffer checks, and sanitize checks.
6. **Public Route Boundary:** Kept `GET /health` unauthenticated for monitoring while protecting all compute/data routes.

---

## 2. Architecture & Request Flow

```
[ Frontend (React/Vite :5173) ]
          │
          │ (JWT Authenticated User API calls)
          ▼
[ Backend (Node.js/Express :5001) ]
          │
          │ (X-Internal-Service-Key: <256-bit secret>)
          ▼
[ AI Service (Python FastAPI :8000) ]
   ├── Public: GET /health
   └── Protected (Depends(verify_service_key)):
         ├── POST /extract-skills
         ├── POST /upload-resume-pdf
         ├── POST /match-jobs
         ├── POST /analyze-skill-gap
         ├── POST /career-intelligence/job-gap
         └── POST /career-intelligence/readiness
```

---

## 3. Implementation Details

### A. FastAPI Authentication Dependency (`ai-service/app/dependencies.py`)
- Created `verify_service_key` dependency using `fastapi.security.APIKeyHeader` looking up `X-Internal-Service-Key`.
- Leveraged Python standard library `hmac.compare_digest` to perform constant-time byte string comparisons, mitigating timing-attack vulnerabilities.
- Raises `HTTPException(401, "Unauthorized: Missing service authentication header.")` when absent.
- Raises `HTTPException(401, "Unauthorized: Invalid service authentication credentials.")` when invalid or truncated.

### B. Route Protection & CORS Configuration (`ai-service/app/main.py`)
- Replaced `allow_origins=["*"]` with explicit parsing of `ALLOWED_ORIGINS`.
- Restricted HTTP methods to `["GET", "POST", "OPTIONS"]`.
- Restricted allowed request headers to `["Content-Type", "Authorization", "X-Internal-Service-Key"]`.
- Attached `verify_service_key` as router-level dependencies across:
  - `skills_router` (`/extract-skills`, `/upload-resume-pdf`)
  - `matching_router` (`/match-jobs`)
  - `gap_router` (`/analyze-skill-gap`)
  - `career_router` (`/career-intelligence/*`)

### C. Node.js Internal Client Integration (`backend/src/services/aiClientService.js`)
- Introduced `getInternalHeaders()` helper method injecting `X-Internal-Service-Key` into every request payload.
- Added `uploadResumePdf(fileBuffer, filename)` with multipart stream construction and auth header injection.

### D. Upload Sanitization (`ai-service/app/routes/skills.py`)
- Added MIME type verification verifying incoming `Content-Type` against `application/pdf`.
- Added empty file check rejecting 0-byte or whitespace-only files with HTTP 400.
- Maintained 5MB ceiling with HTTP 413 Payload Too Large.

---

## 4. Verification & Automated Test Suite

Automated verification suite created in `backend/tests/security_ai_service_auth_suite.js` covering 20 comprehensive security test cases:
1. `GET /health` is publicly accessible without credentials (HTTP 200).
2. Protected endpoints reject missing `X-Internal-Service-Key` (HTTP 401).
3. Protected endpoints reject invalid service keys (HTTP 401).
4. Protected endpoints reject empty service keys (HTTP 401).
5. Partial key match strictly rejected by constant-time verification (HTTP 401).
6. Protected endpoints succeed with valid internal service key (HTTP 200).
7. CORS rejects untrusted external origins (HTTP 400 Disallowed CORS origin).
8. CORS allows trusted frontend origin (`http://localhost:5173`).
9. CORS allows trusted backend origin (`http://localhost:5001`).
10. CORS headers do not expose wildcard origin (`*`) with credentials.
11. PDF upload rejects non-PDF file extension (HTTP 400).
12. PDF upload rejects invalid MIME type (HTTP 400).
13. PDF upload rejects empty payload (HTTP 400).
14. PDF upload rejects payload exceeding 5MB limit (HTTP 413).
15. Skill gap analysis endpoint works with valid service key (HTTP 200).
16. Job matching endpoint works with valid service key (HTTP 200).
17. Career readiness endpoint works with valid service key (HTTP 200).
18. Career job-gap endpoint works with valid service key (HTTP 200).
19. Node.js `AIClientService` internal caller attaches auth and executes successfully.
20. Direct unauthenticated external access blocked across all protected AI routes (HTTP 401).

**Result:** 20/20 Passed.

---

## 5. Full Monorepo Regression Results

All 12 test suites across the monorepo pass cleanly:
1. `backend/tests/security_ai_service_auth_suite.js` (20/20 PASS)
2. `backend/tests/security_company_verification_suite.js` (21/21 PASS)
3. `backend/tests/security_recruiter_ownership_suite.js` (17/17 PASS)
4. `backend/tests/security_admin_privilege_suite.js` (13/13 PASS)
5. `backend/tests/security_jwt_suite.js` (15/15 PASS)
6. `backend/tests/auth_ownership_suite.js` (12/12 PASS)
7. `backend/tests/regression_suite.js` (6/6 PASS)
8. `backend/tests/day3_suite.js` (16/16 PASS)
9. `backend/tests/day4_career_suite.js` (18/18 PASS)
10. `backend/tests/day5_admin_suite.js` (19/19 PASS)
11. `backend/tests/day5_notification_suite.js` (18/18 PASS)
12. `backend/tests/day6_internship_suite.js` (18/18 PASS)

Frontend production build (`npm --prefix frontend run build`):
- Transform modules: 1622 transformed.
- Output: `dist/index.html`, `dist/assets/index-Dp5uwAQn.css`, `dist/assets/index-7wB2z-0K.js` (Exit code: 0).

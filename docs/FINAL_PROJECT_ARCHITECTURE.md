# SkillBridge AI — Final Project Architecture

**SIH Problem Statement:** SIH26044  
**Project:** SkillBridge AI  
**Version:** 1.0.0 (Production Release Candidate)  

---

## 1. System Overview
SkillBridge AI is a full-stack, enterprise-grade Academia-Industry Alignment Platform architected to bridge the gap between higher education curriculums and industry technical skill requirements.

```
                  +-----------------------------------------+
                  |         React 18 + Vite Frontend        |
                  |       Port 5173 / NGINX Container       |
                  +--------------------+--------------------+
                                       |
                     HTTPS / JSON / HttpOnly Cookie + CSRF
                                       |
                                       v
                  +-----------------------------------------+
                  |        Node.js + Express Backend        |
                  |                 Port 5001               |
                  +---------+---------------------+---------+
                            |                     |
           Mongoose / MongoDB TLS                 | Internal Mutual Key
                            |                     | X-Internal-Service-Key
                            v                     v
              +-----------------------+  +------------------------+
              |     MongoDB 6.0/7.0   |  | Python FastAPI Service |
              |  Primary Datastore    |  |       Port 8000        |
              +-----------------------+  +------------------------+
```

---

## 2. Core Service Topology

### A. Frontend Layer (`frontend/`)
* **Framework:** React 18, React Router v7 (`react-router-dom@7.18.6`), Tailwind CSS, Lucide Icons.
* **Build Tool:** Vite 6 with code splitting and gzip optimization.
* **Authentication:** Non-persistent in browser storage (zero JWT in localStorage/sessionStorage). Hydrated via `GET /api/v1/auth/me` with HttpOnly cookie.
* **CSRF Protection:** Axios/Fetch interceptor attaches signed `x-csrf-token` header extracted from `XSRF-TOKEN` cookie.
* **Navigation Security:** `safeRedirect.js` sanitizes all dynamic navigation targets against open redirect, backslash evasion, and malicious URI schemes.

### B. Backend API Gateway (`backend/`)
* **Runtime:** Node.js 20, Express, Mongoose ODM.
* **Security Middleware:** Helmet, CORS (strict allowlist), Double-Submit CSRF with HMAC-SHA256, Express Rate Limiters (environment-aware), Cookie-Parser.
* **Fail-Closed JWT Validation:** Enforces HS256, 256-bit secret length, audience (`skillbridge-users`), issuer (`skillbridge-ai`), and dynamic database `tokenVersion` check.
* **Storage Engine:** Local filesystem abstraction (`storageService.js`) with randomized UUID storage keys, SHA-256 checksum persistence, and restricted download controllers.

### C. AI & Career Intelligence Microservice (`ai-service/`)
* **Runtime:** Python 3.11, FastAPI, Uvicorn, PyMuPDF (fitz), NumPy, Scikit-Learn.
* **Internal Mutual Auth:** Requires `X-Internal-Service-Key` header with constant-time HMAC comparison.
* **Core Engines:**
  * Resume PDF parsing and text extraction.
  * Deterministic and semantic skill taxonomy extraction.
  * Cosine similarity matching between student skills and job requirements.
  * Explainable career readiness breakdown (Academic, Practical Evidence, Skill Match).

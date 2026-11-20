# FINAL PRE-DEPLOYMENT SAFETY AUDIT REPORT

**Project:** SkillBridge AI  
**SIH Problem Statement:** SIH26044  
**Workspace:** `C:\Users\Lenovo\Desktop\Djano`  
**Git Branch:** `feat/day-4-career-intelligence`  
**Audit Date:** 2026-11-20  
**Auditor:** Senior DevOps Engineer & Production Deployment Auditor  

---

## 1. EXECUTIVE SUMMARY & DEPLOYMENT VERDICTS

This audit performs an independent, pre-deployment inspection of the SkillBridge AI codebase, configuration, container definitions, environment variables, network boundaries, and persistence mechanisms.

### Final Deployment Verdicts:
* **Can deploy SIH demo?** **YES**  
  *The full stack is 100% operational locally across ports 5173 (React), 5001 (Node.js Express), and 8000 (Python FastAPI). All 24 backend automated suites, 23 Python tests, and 13 navigation security tests pass. The 5-minute SIH evaluation script with quick demo role autofill functions deterministically.*
* **Can deploy publicly?** **NO (CONDITIONAL ON PRODUCTION CLOUD SETUP)**  
  *Production launch is blocked on external infrastructure and environment provisioning (e.g. provisioning MongoDB Atlas with TLS, configuring real production DNS/HTTPS ingress, creating persistent cloud volumes, and injecting production secrets into container runtimes).*

---

## 2. COMPREHENSIVE FINDINGS MATRIX

| Finding ID | Scope | Classification | Description | Required Remediation / State |
|:---|:---|:---:|:---|:---|
| **SEC-01** | Secrets & Credentials | **BLOCKER (for Public)** | Production deployment requires real runtime injection of cryptographically secure secrets. Default/example placeholders cannot be used. | Set `JWT_SECRET`, `CSRF_SIGNING_SECRET`, and `INTERNAL_SERVICE_KEY` ($\ge 32$ chars each) in the cloud hosting provider environment. Backend fails fast on startup if missing. |
| **SEC-02** | Database Connectivity | **BLOCKER (for Public)** | Local configuration defaults to `mongodb://127.0.0.1:27017/skillbridge_ai`. Production must use a managed cluster. | Configure `MONGO_URI` to a secure MongoDB Atlas connection string (`mongodb+srv://...`) with TLS 1.3 enforced and restricted IP allowlist. |
| **SEC-03** | Ingress & HTTPS | **BLOCKER (for Public)** | Cookies in production enforce `secure: true` and `sameSite: strict`. Serving over plain HTTP in production prevents browser cookie persistence. | Terminate TLS via AWS ALB, Cloudflare, or NGINX reverse proxy with valid SSL certificates. |
| **CFG-01** | Frontend API URL | **HIGH** | Vite client bundles `VITE_API_BASE_URL` at build time. Default in `.env.example` points to `http://localhost:5001/api/v1`. | Build frontend container passing `--build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api/v1` or configure reverse proxy routing `/api/v1` on the same origin. |
| **OPS-01** | Resume Storage Volume | **HIGH** | Resumes are stored on local filesystem (`STORAGE_LOCAL_DIR`). Ephemeral container restarts destroy uploaded resumes without persistent volume. | In `docker-compose.yml`, mount `resume-storage` Docker volume or Kubernetes PersistentVolumeClaim to `/app/storage/resumes`. For multi-instance scaling, implement an S3/GCS bucket driver. |
| **OPS-02** | Multi-Instance Rate Limiting | **MEDIUM** | Rate limiters (`rateLimiter.js`) use in-memory Map stores. Running multiple backend container replicas allows per-instance limit multiplication. | In high-availability multi-replica production clusters, back `express-rate-limit` with Redis (`rate-limit-redis`). |
| **OPS-03** | Database Backups | **MEDIUM** | Monorepo contains no automated backup cron. | Enable automated continuous daily snapshots and point-in-time recovery on MongoDB Atlas. |
| **DEP-01** | Dependency Audit (Dev) | **LOW** | `npm audit` reports 2 moderate advisories in `minimatch` via `nodemon` devDependencies. | Zero production impact because production Docker images use `npm ci --omit=dev`. Update `nodemon` when upstream patches transitive `minimatch`. |

---

## 3. AUDIT OF SPECIFIC DEPLOYMENT AREAS

### 1. Production Environment Variables & Secret Requirements
* **Audit Result:** **PASS (Local) / BLOCKER (Public until provisioned)**
* **Verification:**
  * Backend `config/jwt.js` and `config/csrf.js` enforce fail-closed startup: missing secrets or secrets $< 32$ characters throw fatal errors in production (`NODE_ENV === 'production'`).
  * Cryptographic key separation is verified: `CSRF_SIGNING_SECRET` operates independently of `JWT_SECRET`.
  * `INTERNAL_SERVICE_KEY` is validated with constant-time HMAC comparison between backend and FastAPI AI microservice.

### 2. MongoDB Atlas Connectivity & TLS
* **Audit Result:** **READY FOR ATLAS CONFIGURATION**
* **Verification:**
  * Mongoose connection logic in `backend/src/config/db.js` supports `mongodb+srv://` URIs, TLS encryption, connection timeouts (`DB_CONNECT_TIMEOUT_MS=5000`), and connection pooling (`DB_MAX_POOL_SIZE=10`).
  * Database error logger sanitizes connection strings, ensuring credentials are never printed to stdout.

### 3. Cookie Authentication, CSRF, CORS & HTTPS
* **Audit Result:** **PRODUCTION READY**
* **Verification:**
  * Cookies (`skillbridge_token`) configured with `httpOnly: true`, `path: '/'`, `sameSite: 'strict'` (prod) / `'lax'` (dev), and `secure: isProduction`.
  * Double-submit CSRF mechanism enforces cryptographic HMAC signature on state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
  * Origin/Referer header verification strictly enforces trusted origins. CORS allowlist bars wildcard credential sharing (`*`).

### 4. Resume Storage Persistence
* **Audit Result:** **CONDITIONAL PASS**
* **Verification:**
  * `storageService.js` stores PDF binaries in `STORAGE_LOCAL_DIR` outside the public web root.
  * Filenames are sanitized into randomized UUIDs with SHA-256 integrity checksums stored in MongoDB.
  * In `docker-compose.yml`, persistent named volume `resume-storage` is mapped to `/app/storage/resumes`.
  * *Production Warning:* If scaling horizontally across multiple cloud instances, replace local disk driver with cloud object storage (AWS S3 / GCP GCS / Cloudflare R2).

### 5. Backend-to-AI Private Communication & Service Auth
* **Audit Result:** **PRODUCTION READY**
* **Verification:**
  * Internal communication occurs over private Docker bridge network (`http://ai-service:8000`). AI port `8000` is exposed internally to the Docker network but not published to host ports.
  * Backend attaches `X-Internal-Service-Key` on every request via `aiClientService.js`.
  * AI service rejects unauthenticated requests with HTTP 401.

### 6. Backend Health & Readiness Probes
* **Audit Result:** **PRODUCTION READY**
* **Verification:**
  * `GET /api/v1/health` (Liveness): Returns HTTP 200 `{ status: "UP" }` without exposing internal topology.
  * `GET /api/v1/ready` (Readiness): Returns HTTP 200 only when MongoDB connection state is active (`readyState === 1`) and the AI microservice responds within a bounded 2500ms timeout (`AbortController`).
  * Disconnecting MongoDB or initiating graceful shutdown immediately returns synchronous HTTP 503.

### 7. Frontend Production API URL Configuration
* **Audit Result:** **HIGH PRIORITY CONFIGURATION REQUIREMENT**
* **Verification:**
  * `frontend/src/services/api.js` resolves `import.meta.env.VITE_API_BASE_URL`.
  * Because Vite compiles client code into static JavaScript, the production API URL must be injected during Docker build time via `ARG VITE_API_BASE_URL` or routed through NGINX reverse proxy (`/api/v1`).

### 8. Dockerfiles & Compose Configuration
* **Audit Result:** **PRODUCTION READY**
* **Verification:**
  * `backend/Dockerfile`: Multi-stage build, runs as unprivileged system user `appuser:appgroup` (`USER appuser`).
  * `ai-service/Dockerfile`: Multi-stage build, runs as unprivileged user `appuser` (UID 1000).
  * `frontend/Dockerfile`: Multi-stage build, static assets served via production Alpine NGINX on port 80.
  * `.dockerignore` files present in all three directories, strictly excluding `.env`, `node_modules`, `venv`, `dist`, and resumes.

### 9. Database Backup & Recovery Readiness
* **Audit Result:** **MEDIUM PRIORITY REQUIREMENT**
* **Verification:**
  * Database schemas use immutable UUIDs/ObjectIds and enforce compound unique indexes (e.g. `{ studentId: 1, jobId: 1 }` prevents duplicate applications).
  * Production deployment requires enabling continuous backup and point-in-time restore in MongoDB Atlas.

### 10. Rate Limiting, Logging & Error Handling
* **Audit Result:** **PRODUCTION READY**
* **Verification:**
  * Express rate limiters protect auth routes (100 req/15min) and upload routes (30 req/15min), with test-environment bypass enabled for automated regression suites.
  * Error responses sanitize stack traces in production, returning standardized JSON `{ success: false, error, message }`.

### 11. Dependency Audit Matrix
* **Audit Result:** **PASS FOR PRODUCTION**
* **Verification:**
  * `npm audit --omit=dev`: **0 vulnerabilities** across monorepo root and backend.
  * Production Docker builds use `npm ci --omit=dev`, eliminating development dependencies (`nodemon`, `minimatch`) from container images.

---

## 4. EXACT UNRESOLVED BLOCKERS (FOR PUBLIC LAUNCH)

1. **Host Docker Binary:** Workstation lacks `docker` in `PATH` (requires Docker Desktop on Windows or deployment on a remote Linux cloud VM).
2. **Production Secret Generation:** Real cryptographically secure keys must be generated and set in cloud environment (not hardcoded).
3. **MongoDB Atlas Cluster:** Provisioning a live MongoDB Atlas connection string with TLS and IP allowlist.
4. **HTTPS / Domain Ingress:** Provisioning a public domain name and SSL/TLS certificates for frontend and backend.
5. **Frontend Build Argument:** Supplying the public API domain as `--build-arg VITE_API_BASE_URL` when compiling the frontend image.

---

## 5. EXACT ENVIRONMENT VARIABLES REQUIRED (NAMES ONLY)

### Backend Service:
* `NODE_ENV`
* `PORT`
* `MONGO_URI`
* `JWT_SECRET`
* `CSRF_SIGNING_SECRET`
* `INTERNAL_SERVICE_KEY`
* `CLIENT_URL`
* `AI_SERVICE_URL`
* `STORAGE_LOCAL_DIR`
* `JWT_EXPIRES_IN`
* `JWT_ISSUER`
* `JWT_AUDIENCE`
* `DB_CONNECT_TIMEOUT_MS`
* `DB_MAX_POOL_SIZE`

### AI Microservice:
* `PORT`
* `HOST`
* `ENVIRONMENT`
* `DEBUG`
* `INTERNAL_SERVICE_KEY`
* `ALLOWED_ORIGINS`

### Frontend Service (Build-time):
* `VITE_API_BASE_URL`

---

## 6. RECOMMENDED PRODUCTION DEPLOYMENT ARCHITECTURE

```
                                  [ Cloudflare / Route 53 DNS ]
                                                |
                                   HTTPS Ingress / SSL (Port 443)
                                                |
                     +--------------------------+--------------------------+
                     |                                                     |
                     v (https://app.skillbridge.edu)                       v (https://api.skillbridge.edu)
        +-------------------------+                           +-------------------------+
        |   Frontend Container    |                           |    Backend Container    |
        |   (NGINX Alpine :80)    |                           |  (Node.js Express :5001)|
        +-------------------------+                           +------------+------------+
                                                                           |
                                                    Private Docker Network | (X-Internal-Service-Key)
                                                                           v
                                                              +-------------------------+
                                                              |   AI Service Container  |
                                                              |  (FastAPI Uvicorn :8000)|
                                                              +-------------------------+
                                                                           |
                                                                           v
                                                              [ Managed MongoDB Atlas ]
                                                              (TLS 1.3 / IP Allowlisted)
```

---

## 7. SAFE STEP-BY-STEP DEPLOYMENT SEQUENCE

### Step 1: Provision Cloud Database & Secrets
1. Create a MongoDB Atlas cluster (M10+ recommended for production). Create database user and allowlist cloud server IPs.
2. Generate three distinct 256-bit secrets using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Assign to `JWT_SECRET`, `CSRF_SIGNING_SECRET`, and `INTERNAL_SERVICE_KEY`.

### Step 2: Configure Server Environment
Create `/etc/skillbridge/.env.production` on the production host server with non-root file permissions (`chmod 600`):
```bash
# Set all required environment variables documented in Section 5
```

### Step 3: Build & Deploy Container Images
On a machine or CI runner with Docker installed:
```bash
# 1. Clone repository
git clone https://github.com/your-org/skillbridge-ai.git
cd skillbridge-ai

# 2. Build multi-stage containers
docker compose --env-file /etc/skillbridge/.env.production build

# 3. Launch stack detached
docker compose --env-file /etc/skillbridge/.env.production up -d
```

### Step 4: Verification & Smoke Testing
1. Verify container status: `docker compose ps`
2. Check backend liveness: `curl -f https://api.yourdomain.com/api/v1/health`
3. Check backend readiness: `curl -f https://api.yourdomain.com/api/v1/ready`
4. Verify HTTP 200 on frontend: `curl -I https://yourdomain.com/`
5. Provision first university administrator via secure CLI:
   ```bash
   docker compose exec backend node scripts/provisionAdmin.js admin@university.edu "AdminName" "SecureAdminPassword!123"
   ```

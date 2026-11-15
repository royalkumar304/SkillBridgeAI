# SkillBridge AI — Development & Git Workflow Guide (Updated for Day 3)

Welcome to the **SkillBridge AI** project development guide. This document establishes git conventions, local environment setups, and test procedures for team collaboration.

---

## 1. Local Environment Configuration

> [!IMPORTANT]
> Port 5000 is occupied by machine background services on this development workstation.
> The canonical backend port is **5001**.
> The canonical AI microservice port is **8000**.
> The canonical frontend Vite port is **5173**.
> MongoDB runs as a Windows Service at `localhost:27017`.

### Backend (`backend/.env`):
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/skillbridge_ai
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

### AI Service (`ai-service/.env`):
```env
PORT=8000
HOST=0.0.0.0
DEBUG=True
ENVIRONMENT=development
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_AI_SERVICE_URL=http://localhost:8000
```

---

## 2. Git Workflow & Branching Strategy

```
main ──────────────── (Stable Production / Competition Final)
  ▲
feat/day-2-auth-resume (Day 2 Auth & PyMuPDF - Tag: b5b4246)
  ▲
feat/day-3-student-jobs (Day 3 Profile, Jobs, Applications, Match Engine)
```

### Rules:
1. **Never commit directly to `main`**: All features must be tested before merging.
2. **Never push to GitHub** without explicit user confirmation.
3. **Branch naming**: Use `feat/<day-number>-<feature-name>` (e.g. `feat/day-3-student-jobs`).
4. **Commit convention**: Conventional Commits (e.g., `feat(day-3): implement student profile, jobs, application engine and match integration`).

---

## 3. Running Automated Tests

### Day 3 Backend & Integration Test Suite
To execute the automated regression and acceptance test suite for Day 3:
```powershell
node backend/tests/day3_suite.js
```
This suite programmatically executes:
1. Student profile creation and update
2. Student cross-user modification protection (isolation)
3. Profile readiness index computation (100% test)
4. Recruiter job creation and publishing
5. Student job listing access
6. Closed job application rejection (HTTP 400)
7. Active job application submission
8. Duplicate application prevention via compound index (HTTP 409)
9. Recruiter cross-company job modification rejection (HTTP 403)
10. Recruiter applicant viewing with candidate profile enrichment
11. Recruiter application status progression (SHORTLISTED)
12. Student private application tracking
13. Deterministic FastAPI match score calculation and explainable breakdown

### Frontend Production Build Test
```powershell
cd frontend
npm run build
```
Build output must compile with 0 errors.

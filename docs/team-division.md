# SkillBridge AI — 4-Member Team Ownership & Task Division

This document outlines the division of responsibilities for our 4-member hackathon team targeting SIH 2026 Problem Statement **SIH26044**.

---

## Team Roster & Ownership Matrix

| Member | Primary Role | Domain Ownership | Target Deliverables |
| :--- | :--- | :--- | :--- |
| **Member 1** | Frontend Lead (React/UI) | `frontend/` directory, User journeys | Student Portal, Recruiter UI, Auth flows, responsive Tailwind layouts |
| **Member 2** | Backend Lead (Node/Express) | `backend/` directory, Database | JWT Auth, Mongoose Schemas (11 collections), REST API routes, RBAC |
| **Member 3** | AI/ML Lead (Python/FastAPI) | `ai-service/` directory | Skill extraction, Resume parser, Job match scoring engine, Gap analyzer |
| **Member 4** | DevOps & Integration Lead | `docs/`, Root configs, Shared Views | University Admin Dashboard, API wiring, Docker/Deploy, Demo PPT & pitch |

---

## Detailed Member Breakdown

### 🧑‍💻 Member 1: Frontend Developer
- **Branch**: `feat/frontend-views`
- **Core Responsibilities**:
  1. Build clean, responsive UI with React + Vite + Tailwind CSS.
  2. Implement role-protected routing for `STUDENT`, `RECRUITER`, and `UNIVERSITY_ADMIN`.
  3. Student Views: Skill profile, resume upload card, job matching list, application tracker.
  4. Recruiter Views: Job creation form, applicant shortlist table.
  5. API Integration: Connect to Express backend using clean Axios/Fetch service layer (`src/services/api.js`).

### 🧑‍💻 Member 2: Backend Developer
- **Branch**: `feat/backend-core`
- **Core Responsibilities**:
  1. Maintain Express application structure and MongoDB Mongoose models.
  2. Implement bcrypt password hashing, JWT signing, and role verification middleware (`authMiddleware.js`, `roleMiddleware.js`).
  3. Build CRUD endpoints for Student Profiles, Jobs, Applications, and Skill Assessments.
  4. Ensure unique indexes on `studentId + jobId` to prevent double applications.
  5. Validate all incoming request payloads with descriptive error responses.

### 🧑‍💻 Member 3: AI/ML Developer
- **Branch**: `feat/ai-microservice`
- **Core Responsibilities**:
  1. Maintain Python FastAPI microservice (`ai-service/`).
  2. Day 1: Provide high-fidelity, validated mock endpoints for skill extraction, job matching, and gap analysis.
  3. Day 2+: Integrate PyMuPDF text extractor, spaCy NER or regex-based skill dictionary matching.
  4. Implement weighted skill similarity algorithm:  
     $$\text{Score} = \sum_{i=1}^n w_i \times m_i$$
  5. Provide career progression roadmaps based on missing skill sets.

### 🧑‍💻 Member 4: Integration & DevOps Lead
- **Branch**: `feat/integration-admin`
- **Core Responsibilities**:
  1. University Admin Portal: Aggregate student skill gap charts, placement percentage, recruiter trends.
  2. Bridge Express backend with FastAPI microservice via authenticated HTTP client.
  3. Coordinate daily Git pulls and merges into `dev` branch.
  4. Run automated build checks and health audits across all 3 services.
  5. Prepare the 5-minute SIH presentation deck and demo walkthrough.


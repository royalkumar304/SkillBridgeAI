# SkillBridge AI — SIH Evaluation & Live Demo Readiness Guide

**Problem Statement:** SIH26044  
**Project:** SkillBridge AI  
**Theme:** Academia-Industry Collaboration & Career Intelligence  

---

## 1. Problem Statement & Proposed Solution
Higher education institutions face a systemic misalignment between academic curricula and evolving technical skills demanded by the tech industry. Students lack transparency into specific skill deficits, while recruiters struggle to evaluate real competency from self-reported claims.

**SkillBridge AI** provides an end-to-end bridge:
1. **AI-Driven Skill Provenance:** Automatically parses PDF resumes via PyMuPDF, extracts skills, and tags them as `resume_extracted` to prevent self-reported forgery.
2. **Deterministic Career Readiness Index:** Calculates an explainable readiness score across Academic Performance (20%), Practical Evidence (30%), and Job Skill Coverage (50%) with zero artificial metric inflation.
3. **University Governance & Institutional Isolation:** Empowers university administrators to track cohort readiness and approve verified recruiter partners.
4. **Enterprise Security & Data Protection:** Employs HttpOnly cookie sessions, double-submit HMAC CSRF defense, server-side token versioning, and private resume access isolation.

---

## 2. Realistic 5-Minute Live Demo Sequence

### Act 1: Student Career Readiness & Resume Extraction (2 Minutes)
1. Navigate to `http://localhost:5173/login`. Click quick autofill **Student** (`student@demo.com`).
2. Show the **Student Dashboard**: Point out the live Career Readiness Score (calculated authentically from profile data, zero hardcoded numbers).
3. Open **Profile**: Upload a sample PDF resume (`backend/tests/sample_resume.pdf`).
4. Watch skills automatically extracted and tagged with `resume_extracted` provenance.
5. Visit **Career Intelligence**: Demonstrate dynamic Skill Gap Analysis for "Full Stack Developer" showing matching vs missing competencies.

### Act 2: Recruiter Job Posting & Approval Gate (1.5 Minutes)
1. Sign out. Autofill **Recruiter** (`recruiter@demo.com`).
2. Show that an unverified recruiter cannot publish jobs (HTTP 403 Approval Gate).
3. Demonstrate company verification status indicator.
4. Create an Internship listing with duration, stipend, and required skill weights.

### Act 3: University Admin Governance (1.5 Minutes)
1. Sign out. Autofill **Admin** (`admin@demo.com`).
2. Open **Company Approvals**: Review pending recruiter company applications and approve the company with one click.
3. Open **Student Roster**: Display university-scoped student analytics and average career readiness.
4. Open **Curriculum Insights**: Show high-demand industry skills vs university student skill saturation, empowering departments to update course modules.

---

## 3. Implemented vs Future Roadmap

| Feature Area | Implemented in Release Candidate 1.0 | Future Roadmap |
|---|---|---|
| **Resume Extraction** | PyMuPDF text normalization + deterministic skill mapping | Vision LLM extraction for complex infographic resumes |
| **Authentication** | HttpOnly Cookie + Double-Submit CSRF + Server Token Revocation | Hardware WebAuthn / FIDO2 security keys |
| **Readiness Engine** | Multi-factor weighted deterministic scoring (0–100%) | Historical cohort machine-learning placement predictor |
| **Storage Engine** | Local filesystem with UUID obfuscation & SHA-256 integrity | AWS S3 / Cloudflare R2 bucket driver |
| **Notifications** | In-app notification polling & read-tracking | WebSocket live streaming + email webhooks |

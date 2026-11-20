# SkillBridge AI — Academia–Industry Collaboration Platform
> **Smart India Hackathon 2026** | **Problem Statement:** SIH26044
> **Problem Title:** Portal for Academia - Industry Collaboration for Skill Mapping, Internships and Placement

SkillBridge AI is a tri-service, AI-powered platform designed to eliminate the mismatch between university curricula and corporate technical expectations. It unifies **Students**, **Recruiters**, and **University Administrators** through explainable skill mapping, PyMuPDF resume parsing, career readiness indexes, verified learning paths, and campus-wide curriculum analytics.

---

## 1. System Architecture

```
[ Frontend: React 19 + Vite + Tailwind ] (Port 5173)
           │                        ▲
           ▼                        │
[ Node.js / Express REST API ] (Port 5001) <───> [ MongoDB 127.0.0.1:27017 ]
           │
           ▼
[ Python FastAPI AI Microservice ] (Port 8000)
    ├── PyMuPDF (fitz) Resume Parser
    └── Rule-Based Taxonomy Normalizer (No LLM Hallucinations)
```

---

## 2. Key Capabilities by Role

### Student Portal
- **Resume Upload & AI Skill Extraction:** Parses PDF resumes and extracts standardized technical competencies with confidence scores.
- **1-Click Profile Sync:** Synchronizes extracted skills directly into the student profile with duplicate suppression and level preservation.
- **Career Readiness Index:** Transparent formula evaluates skills (50%), practical evidence (30%), and academic performance (20%).
- **Skill Gap & Learning Roadmap:** Identifies matched vs missing skills for target roles and provides verified documentation links.
- **Opportunities Board:** Dedicated portals for full-time jobs and internships with work mode, duration, and stipend filters.
- **Application Tracking & Notifications:** Real-time in-app status notifications upon application review, shortlisting, or selection.

### Recruiter Desk
- **Corporate Accreditation Profile:** Maintains legal identity, industry classification, website, and verified recruiter contacts.
- **Accreditation Gate:** Unverified companies are prevented from publishing postings until approved by University Administration.
- **Opportunity Management:** Publish, edit, and close jobs and internships.
- **Candidate Review:** Enriched applicant views displaying verified technical skills, GitHub projects, and CGPA.
- **Status Lifecycle:** Shortlist, reject, or select candidates with automated notification dispatches to applicants.

### University Administration
- **Live Institutional Dashboard:** Real-time platform aggregations (student enrollment, placement rates, partner counts).
- **Filterable Student Directory:** Query students by name, branch specialization, and minimum CGPA cutoffs.
- **Corporate Accreditation Desk:** Verify or revoke corporate partners with single-click actions.
- **Campus Internship Governance:** Track all active campus internships, applicant counts, and placement ratios.
- **Industry Skill Demand Analytics:** Compares real industry demand percentage against student proficiency to identify curriculum deficits.
- **Curriculum Insights:** Evidence-based recommendations for syllabus upgrades and practical laboratory projects.

---

## 3. Technology Stack

- **Frontend:** React 19, Vite v6.4.6, Tailwind CSS, React Router v7, Lucide Icons
- **Backend:** Node.js v26.4.0, Express 4.19, Mongoose 8.3, JWT, bcryptjs, Helmet, Express Rate Limit
- **AI Microservice:** Python 3.12, FastAPI, Uvicorn, PyMuPDF (fitz)
- **Database:** MongoDB Community Edition (v7.0+)

---

## 4. Local Quickstart Guide

### Prerequisites
- Node.js v18+ (tested on v26)
- Python 3.10+ (tested on 3.12)
- MongoDB running on `mongodb://127.0.0.1:27017`

### Step 1: Clone & Configure Environments
```bash
# Backend Environment
cd backend
cp .env.example .env

# AI Service Environment
cd ../ai-service
# Python virtual environment setup
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Start Services
```bash
# Terminal 1: AI Service (Port 8000)
cd ai-service
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Backend REST API (Port 5001)
cd backend
npm run dev

# Terminal 3: Frontend Client (Port 5173)
cd frontend
npm run dev
```

### Step 3: Secure Admin Provisioning (CLI-Only)
Direct public registration for `UNIVERSITY_ADMIN` is strictly forbidden and rejected at the backend (HTTP 400).
To provision a university administrator account locally:
```bash
# Interactive mode (prompts for email, name, and hidden password):
node backend/scripts/provisionAdmin.js

# Or via environment variables:
ADMIN_EMAIL="admin@univ.edu" ADMIN_PASSWORD="YourSecurePassword@123" ADMIN_NAME="Dean S. K. Verma" node backend/scripts/provisionAdmin.js
```

---

## 5. Automated Verification

Execute the complete automated test suite across all modules:
```bash
node -e "
const { execSync } = require('child_process');
const suites = [
  'node backend/tests/regression_suite.js',
  'node backend/tests/day3_suite.js',
  'node backend/tests/auth_ownership_suite.js',
  'node backend/tests/day4_career_suite.js',
  'node backend/tests/day5_admin_suite.js',
  'node backend/tests/day5_notification_suite.js',
  'node backend/tests/day6_internship_suite.js',
  'node backend/tests/test_pdf_upload.js'
];
suites.forEach(cmd => { console.log('Running:', cmd); execSync(cmd, { stdio: 'inherit' }); });
console.log('All test suites verified successfully!');
"
```

Verify frontend production build:
```bash
cd frontend
npm run build
```

---

## 6. Official Documentation References

- [Final Project Audit](file:///docs/FINAL_PROJECT_AUDIT.md)
- [Final Security Audit](file:///docs/FINAL_SECURITY_AUDIT.md)
- [Final Test Report](file:///docs/FINAL_TEST_REPORT.md)
- [Local Setup Guide](file:///docs/LOCAL_SETUP_GUIDE.md)
- [SIH Presentation Content](file:///docs/SIH_PRESENTATION_CONTENT.md)
- [SIH 5-Minute Demo Script](file:///docs/SIH_5_MINUTE_DEMO_SCRIPT.md)
- [SIH Judge Q&A Guide](file:///docs/SIH_JUDGE_QA.md)
- [Team Contributions Matrix](file:///docs/TEAM_CONTRIBUTIONS.md)
- [Demo Data Setup Guide](file:///docs/DEMO_DATA_SETUP.md)
- [Final Release Checklist](file:///docs/FINAL_RELEASE_CHECKLIST.md)

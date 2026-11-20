# SkillBridge AI — 5-Minute SIH Live Demonstration Script

**Problem Statement:** SIH26044 | **Strict Timing Target:** 05:00 Minutes | **Theme:** Academia-Industry Collaboration

---

## 1. Pre-Flight Setup Checklist (Local Demonstration)
1. **Node.js Express Backend:** Running on `http://localhost:5001`
2. **Python FastAPI AI Microservice:** Running on `http://localhost:8000`
3. **React Vite Frontend:** Running on `http://localhost:5173`
4. **Browser:** Chrome/Edge open at `http://localhost:5173/login` with Quick Test Autofill buttons visible.

---

## 2. 5-Minute Live Demonstration Timeline

### [00:00 – 00:45] Problem Context & System Overview
* **Action:** Open landing page at `http://localhost:5173`.
* **Talking Points:**
  > *"Higher education institutions face an ongoing challenge: universities teach fundamental theory, but tech recruiters demand validated practical skills. SkillBridge AI bridges SIH Problem Statement SIH26044 by connecting Students, Corporate Recruiters, and University Deans into a shared career intelligence ecosystem."*

---

### [00:45 – 01:45] Student Experience: AI Skill Provenance & Resume Parsing
* **Action:** Click Sign In -> Click **Student** quick autofill (`student@demo.com`) -> Sign In.
* **Demonstrate:**
  1. **Student Dashboard:** Real-time calculated Career Readiness index. Zero hardcoded placeholder stats.
  2. **Resume Management:** Open Profile -> Upload resume PDF. Show PyMuPDF extracting technical skills with provenance set to `resume_extracted` to prevent self-reported claim forgery.
* **Talking Points:**
  > *"Instead of relying on unverified claims, our Python AI microservice extracts technical competencies directly from the PDF resume and marks their provenance as `resume_extracted`. This protects recruiters from candidate claim manipulation."*

---

### [01:45 – 02:45] Career Intelligence: Transparent Readiness & Gap Analysis
* **Action:** Navigate to **Career Readiness** & **Skill Gap Analysis**.
* **Demonstrate:**
  1. **Transparent 3-Pillar Score:** Skills Coverage (50%), Practical Evidence (30%), Academic Performance (20%).
  2. **Role Gap Analysis:** Select "Full Stack Developer" -> Show exact matching vs missing skills with curated learning links.
* **Talking Points:**
  > *"The student receives explainable readiness feedback. If a student lacks Docker or TypeScript, SkillBridge AI highlights the deficit and links directly to official documentation roadmaps."*

---

### [02:45 – 03:45] Recruiter Workflow: B2B Governance & Candidate Selection
* **Action:** Sign out -> Click **Recruiter** quick autofill (`recruiter@demo.com`) -> Sign In.
* **Demonstrate:**
  1. **Company Verification Indicator:** Highlight that an unverified recruiter cannot post jobs (HTTP 403 Approval Gate).
  2. **Internship Management:** View candidate applications, view candidate readiness match scores, and download resume (consented candidate access only).
  3. **Application Status Update:** Change candidate status to `SHORTLISTED` (dispatches real-time in-app notification).
* **Talking Points:**
  > *"Corporate recruiters cannot spam students. Only verified enterprise partners can publish openings, and resumes can only be downloaded once a candidate submits an application."*

---

### [03:45 – 04:30] University Dean & Admin Portal: Curriculum Alignment
* **Action:** Sign out -> Click **Admin** quick autofill (`admin@demo.com`) -> Sign In.
* **Demonstrate:**
  1. **Company Approvals:** One-click review and verification of industry partners.
  2. **Student Roster:** University-scoped cohort analytics.
  3. **Curriculum Insights:** Live graph comparing local student skill saturation against corporate market demand.
* **Talking Points:**
  > *"University administrators gain actionable curriculum insights. If industry demand for Cloud Architecture is high but cohort saturation is low, department heads can adjust course syllabi for the next academic semester."*

---

### [04:30 – 05:00] Enterprise Security Summary & Conclusion
* **Action:** Show the security architecture slide or test summary.
* **Talking Points:**
  > *"SkillBridge AI is production-hardened: HttpOnly cookie authentication, double-submit HMAC CSRF defense, 0 production vulnerabilities, and 24 passing automated regression suites. Thank you."*

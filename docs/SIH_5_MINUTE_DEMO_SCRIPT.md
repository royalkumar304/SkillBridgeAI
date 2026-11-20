# SkillBridge AI — 5-Minute SIH Live Demonstration Script
**Problem Statement:** SIH26044 | **Strict Timing Target:** 05:00 Minutes | **Demo Lead:** Full-Stack Presenter

---

## Preparation Checklist Before Starting
- Backend running on `http://localhost:5001`
- AI Microservice running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Browser with three separate tabs or windows (Student, Recruiter, University Admin)
- Sample resume PDF (`test_resume.pdf`) available on desktop

---

## Minute-by-Minute Script

### [00:00 – 00:30] Introduction & Value Proposition
- **Action:** Open `http://localhost:5173` (SkillBridge AI Landing Page).
- **What to Say:**
  > *"Respected Judges, university education often operates in isolation from corporate demands, leaving students uncertain about their readiness and universities blind to curriculum gaps. SkillBridge AI solves Problem SIH26044 by connecting Students, Recruiters, and Universities on a single data-backed platform. Let us show you the real platform in action across all three roles."*

---

### [00:30 – 01:15] Student Portal: Login & Profile
- **Action:** Click **Sign In** &rarr; Log in as `student1@skillbridge.edu` (or click Get Started).
- **What to Show:** Student Dashboard with profile completion index and quick stats.
- **What to Say:**
  > *"Here is our Student Hub. A student's profile is not just a form—it is an intelligent technical portfolio containing validated skills, GitHub project links, and academic metrics."*

---

### [01:15 – 02:00] Resume PDF Upload & 1-Click Skill Sync
- **Action:** Navigate to **My Profile** &rarr; **Resume Upload** &rarr; Select `test_resume.pdf` &rarr; Click **Extract Skills with AI**.
- **What to Show:** PyMuPDF extracts 11 standardized skills (React, Node.js, Docker, Python) with confidence indicators. Click **Sync Extracted Skills to Profile**.
- **What to Say:**
  > *"Our FastAPI microservice uses PyMuPDF to extract text from real resumes. Instead of using black-box hallucinations, it maps terms to standardized industry taxonomies. With one click, these skills are merged into the student's database profile without downgrading existing proficiencies."*

---

### [02:00 – 02:45] Career Readiness & Skill Gap Analysis
- **Action:** Click **Career Intelligence** in the sidebar.
- **What to Show:**
  - Career Readiness Score (e.g. 61.6/100).
  - Transparent 3-pillar breakdown: **Skills Coverage (50%)**, **Practical Evidence (30%)**, and **Academic Standing (20%)**.
  - Skill Gap Breakdown & Verified Learning Roadmap with official documentation links.
- **What to Say:**
  > *"Notice how transparent this scoring is. We show students exactly why they scored 61.6%, which skills are missing for their target role, and provide verified HTTPS documentation links to help them bridge those gaps."*

---

### [02:45 – 03:30] Internship Board & Application Submission
- **Action:** Click **Internship Board** (`/student/internships`) &rarr; Filter by Work Mode (`Remote`) or Stipend (`Paid`) &rarr; Click **Inspect & Apply** on an opening.
- **What to Show:** Detailed modal showing duration (3 Months), work mode, required skills, and stipend. Click **Submit Application**. Observe the card status change to `Applied`.
- **What to Say:**
  > *"Here is our dedicated Internship Board with transparent durations and stipends. Notice that when the student applies, our database prevents duplicate submissions with an automatic HTTP 409 guard."*

---

### [03:30 – 04:15] Recruiter Desk: Candidate Review & Shortlisting
- **Action:** Switch to Recruiter window (`recruiter1@techcorp.com`) &rarr; Click **Manage Internships** &rarr; Click **Review Applicants**.
- **What to Show:**
  - Notice the bell notification badge has incremented (`New Application Received`).
  - View the student's enriched technical profile.
  - Click **Shortlist**.
- **What to Say:**
  > *"The recruiter instantly receives an in-app notification. They review the applicant's real skills, projects, and CGPA, and move them to 'Shortlisted'. In the student's window, the status immediately reflects as 'Shortlisted' with an in-app celebration alert."*

---

### [04:15 – 04:45] University Administration: Curriculum Gaps & Industry Demand
- **Action:** Switch to Admin window (`admin@univ.edu`) &rarr; Navigate to **Curriculum Insights** (`/admin/curriculum-insights`).
- **What to Show:**
  - Industry Demand % vs Campus Availability % table (e.g. Docker: 80% demand vs 35% supply).
  - Actionable curriculum recommendations: *"High Industry Deficit: Integrate practical Docker lab assignments."*
- **What to Say:**
  > *"This is the institutional superpower of SkillBridge AI. The administration can see real-time skill deficits across all active recruiter postings versus campus talent, giving the Academic Council data-backed evidence to update syllabi."*

---

### [04:45 – 05:00] Conclusion & Live Q&A
- **Action:** Switch back to the landing page.
- **What to Say:**
  > *"SkillBridge AI replaces guesswork with transparent intelligence for students, verified talent pipelines for recruiters, and actionable curriculum analytics for universities. 100% of the features shown are running on real MongoDB collections and verified by 107 automated tests. Thank you, and we welcome your questions!"*

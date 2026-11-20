# SkillBridge AI — 4-Member Team Contribution Matrix
**SIH Problem Statement:** SIH26044 | **Problem Title:** Portal for Academia - Industry Collaboration for Skill Mapping, Internships and Placement

This document details the responsibilities and verified implementation deliverables across our four-member engineering team.

---

## Member 1: Frontend Architecture & User Experience Lead
**Name:** [Team Member 1 Placeholder]  
**Primary Focus:** Client-Side Engineering, Responsive UI, State Management & Accessibility  

### Key Contributions & Verified Deliverables:
- Designed and built the responsive React 19 application using Vite and Tailwind CSS.
- Implemented role-protected navigation and layout containers (`StudentLayout`, `RecruiterLayout`, `AdminLayout`).
- Developed the **Internship Opportunity Board** (`InternshipBoard.jsx`) with multi-attribute filtering (work mode, stipend, duration, required skills).
- Created the **Recruiter Internship Desk** (`ManageInternships.jsx`) and candidate review interfaces.
- Built the **Curriculum Insights** (`CurriculumInsights.jsx`) and **Industry Partners** (`IndustryPartners.jsx`) admin views.
- Built the **In-App Notification Dropdown** (`NotificationDropdown.jsx`) with live badge counters and 45s polling.
- Verified frontend production builds with Vite (1622 modules transformed with zero errors).

---

## Member 2: Backend Core & Database Architecture Lead
**Name:** [Team Member 2 Placeholder]  
**Primary Focus:** REST API Design, MongoDB Modeling, Authentication & Role-Based Access Control  

### Key Contributions & Verified Deliverables:
- Architected the Node.js Express server on port 5001 with robust error-handling middleware.
- Implemented secure JWT authentication with HMAC-SHA256 signing, 7-day expiration, and `bcryptjs` password hashing.
- Designed Mongoose database models: `User`, `StudentProfile`, `Job`, `Application`, `Company`, and `Notification`.
- Enforced strict role-based access control (`requireRole`) and ownership isolation across all endpoints.
- Engineered compound unique indexes (`{ studentId: 1, jobId: 1 }`) preventing duplicate applications (HTTP 409).
- Built recruiter company profile endpoints (`/api/v1/companies/profile`) and accreditation workflows.
- Implemented MongoDB aggregation pipelines for admin statistics and student directories.

---

## Member 3: AI Microservice & Data Intelligence Specialist
**Name:** [Team Member 3 Placeholder]  
**Primary Focus:** Python FastAPI Microservice, Document Parsing & Explainable Skill Mapping  

### Key Contributions & Verified Deliverables:
- Built and deployed the Python FastAPI microservice on port 8000.
- Implemented resume parsing using PyMuPDF (`fitz`) for memory-stream PDF text extraction.
- Developed the deterministic skill taxonomy pattern normalizer supporting canonical alias resolution.
- Engineered the Career Readiness scoring engine (50% skills, 30% evidence, 20% academic baseline).
- Implemented the job-matching engine comparing student competencies against employer job criteria.
- Integrated personalized learning roadmap generators linking exclusively to verified HTTPS documentation portals.
- Verified non-blocking communication between the Node.js backend and the FastAPI service with safe fallbacks.

---

## Member 4: Integration, QA & Security Auditor
**Name:** [Team Member 4 Placeholder]  
**Primary Focus:** System Integration, Test Automation, Security Hardening & Documentation  

### Key Contributions & Verified Deliverables:
- Architected and automated all 8 comprehensive test suites (107 distinct automated tests passing 100%).
- Implemented the centralized In-App Notification engine (`notificationService.js`) with 2-minute deduplication windows.
- Engineered the corporate approval gate blocking unverified recruiters from publishing postings (HTTP 403).
- Implemented campus-wide curriculum gap analytics comparing aggregate industry demand vs student readiness.
- Hardened server infrastructure using `helmet` security headers, CORS origin restrictions, and rate limiting.
- Authored the official documentation suite: Setup Guide, SIH Presentation, 5-Minute Demo Script, and Judge Q&A.
- Managed Git repository hygiene ensuring zero secrets or temporary artifacts are committed.

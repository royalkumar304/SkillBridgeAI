# SkillBridge AI — SIH 2026 Presentation Content (10-Slide Deck)
**SIH Problem Statement:** SIH26044 | **Problem Title:** Portal for Academia - Industry Collaboration for Skill Mapping, Internships and Placement

---

## Slide 1: Title & Overview
- **Header:** SkillBridge AI
- **Subheader:** Intelligent Academia–Industry Collaboration Platform for Skill Mapping, Internships, and Placement
- **Problem Statement:** SIH26044
- **Team Identification:** 4-Member Engineering Team
- **Tagline:** Bridging the Classroom-to-Corporate Skill Divide Through Transparent AI Intelligence

---

## Slide 2: The Core Problem
- **Curriculum-Industry Disconnect:** Universities lack real-time visibility into the exact technical competencies demanded by hiring managers.
- **Subjective Resume Screening:** Students self-report buzzwords without verified evidence or standardized taxonomy alignment.
- **Fragmented Internships:** Internship postings lack clear work modes, verified stipends, and structured mentorship tracking.
- **Black-Box Hiring Outcomes:** Students receive rejections without actionable skill gap breakdowns or learning pathways.

---

## Slide 3: The Proposed Solution
- **Tri-Pillar Collaboration Network:** Unifies **Students**, **Recruiters**, and **University Administrators** in a single ecosystem.
- **Deterministic AI Skill Extraction:** PyMuPDF resume parsing mapped against a standardized industry taxonomy without LLM hallucinations.
- **Explainable Career Readiness Index:** Transparent 50/30/20 formula evaluating skills, practical evidence, and academic standing.
- **Data-Driven Curriculum Analytics:** Computes actual campus-wide skill deficits to guide academic curriculum revisions.

---

## Slide 4: Target User Personas
- **Students:** Gain personalized career roadmaps, real-time match scoring against live job requirements, and in-app application tracking.
- **Corporate Recruiters:** Access verified student talent, publish vetted jobs/internships, and manage application status lifecycles.
- **University Administrators:** Monitor placement statistics, govern corporate accreditation, and align syllabi with market demand.

---

## Slide 5: System Architecture & Data Flow
- **Client Tier:** React 19 + Vite responsive frontend with role-based navigation and live notification polling.
- **Core API Tier:** Node.js Express REST API enforcing JWT security, role-based access control, and ownership isolation.
- **Database Tier:** MongoDB Community instance with compound unique indexes preventing duplicate applications and data corruption.
- **AI Microservice:** Python FastAPI service executing fast, deterministic PyMuPDF resume parsing and weighted skill matching.

---

## Slide 6: Key Features & Demonstrable Workflows
- **Resume Upload & 1-Click Sync:** Extracts standardized skills from PDF resumes and merges them into profiles without downgrading levels.
- **Dual Opportunity Board:** Distinct portals for full-time jobs and internships with location, stipend, and work mode filters.
- **Campus Skill Deficit Engine:** Calculates real percentage demand vs student readiness across all active database postings.
- **In-App Notification Hub:** Dispatches instant alerts on application submission, shortlisting, selection, and company accreditation.

---

## Slide 7: Technical Differentiators & Innovation
- **Zero Hallucination Guarantee:** Uses standardized taxonomy pattern matching and canonical alias resolution rather than stochastic generative text.
- **Explainable Scoring:** Both student readiness and job matching return transparent formula breakdowns rather than opaque black-box numbers.
- **Corporate Accreditation Gating:** Prevents unverified companies from publishing jobs or recruiting students without admin approval.
- **Tenant & Recipient Privacy:** Strict database-level isolation ensures no cross-recruiter applicant inspection or peer data leakage.

---

## Slide 8: Measurable Impact & Institutional Benefits
- **Students:** 100% clarity on required competencies before applying; actionable learning roadmaps with verified HTTPS documentation.
- **Universities:** Real-time visibility into curriculum gaps (e.g. Docker 78% industry demand vs 35% campus availability).
- **Industry Partners:** Streamlined pipeline of qualified, verified candidates reducing recruitment cycles.

---

## Slide 9: Feasibility, Scalability & Roadmap
- **Current State:** 100% operational on local tri-service stack; 107/107 automated tests passing; production frontend build verified.
- **Horizontal Scalability:** Stateless Node.js and FastAPI services designed for containerized Kubernetes deployment.
- **Future Enhancements:** Automated GitHub portfolio code analysis, enterprise SSO (SAML/OAuth) for universities, and proctored coding assessments.

---

## Slide 10: Conclusion & Live Demonstration
- **Summary:** SkillBridge AI replaces fragmented spreadsheets and opaque job boards with an actionable, data-backed collaboration hub.
- **Demo Invitation:** We invite the evaluators to witness the live student application, recruiter shortlisting, and admin curriculum insight flow.
- **Thank You:** Open for Questions and Evaluation.

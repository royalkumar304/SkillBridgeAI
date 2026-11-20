# SkillBridge AI — SIH Judges' Q&A Master Guide (30 Questions & Answers)
**SIH Problem Statement:** SIH26044 | **Problem Title:** Portal for Academia - Industry Collaboration for Skill Mapping, Internships and Placement

---

### Core Concept & Problem Understanding

#### Q1: What exact problem is SkillBridge AI solving?
**A:** We solve the academia-industry competency gap (SIH26044). Universities do not know what technical skills companies actually require in real time, students do not know where their specific deficits lie, and recruiters waste resources filtering through unqualified resumes. SkillBridge AI provides a unified platform where real industry demand data drives student learning paths and university curriculum updates.

#### Q2: Why is this problem important right now?
**A:** Technology stacks change rapidly while academic syllabi take years to revise. As a result, thousands of engineering graduates struggle with employability despite high CGPAs. A data-driven feedback loop is essential to align university education with industry needs.

#### Q3: How is SkillBridge AI different from LinkedIn, Indeed, or existing job boards?
**A:** Traditional job boards are passive bulletin boards designed for open-market job listings. SkillBridge AI is an institutional academia-industry collaboration platform. It offers:
1. University Admin governance and accreditation.
2. Transparent career readiness scoring (50% skills, 30% evidence, 20% academic).
3. Campus-wide curriculum deficit heatmaps comparing aggregate employer demand against student skills.

---

### AI & Technical Implementation

#### Q4: How does your skill extraction work?
**A:** Uploaded PDF resumes are streamed directly into our Python FastAPI service. PyMuPDF extracts raw text blocks. We then run a rule-based taxonomy pattern matcher that maps aliases (e.g., `react.js`, `reactjs` &rarr; `React`) into canonical skill objects. It is deterministic, fast (<100ms), and eliminates LLM hallucinations.

#### Q5: Why did you avoid using a generative LLM for resume skill extraction?
**A:** Generative LLMs are prone to hallucinating skills not present in the document, cost significant API fees, and introduce latency. Our standardized rule-based taxonomy parser guarantees 100% explainability, zero false positives, and strict reproducibility.

#### Q6: How do you calculate the Career Readiness score?
**A:** We use a transparent 3-pillar formula:
- **Skill Coverage (50 points):** Ratio of benchmark skills matched for the student's target role.
- **Practical Evidence (30 points):** Verified GitHub projects, hackathon certifications, and prior experience.
- **Academic Standing (20 points):** CGPA normalization (e.g., CGPA &ge; 7.0 contributes full academic baseline).

#### Q7: How do you calculate the skill gap for a specific job?
**A:** When a student inspects an opening, the system compares their verified skills against the job's required skills and minimum proficiency levels. Skills with matching levels are categorized as `Matched`; skills held with lower proficiency are marked as `Partially Matched`; missing skills are labeled as `Missing` and automatically linked to verified HTTPS documentation resources.

#### Q8: How does the AI microservice communicate with the Node.js backend?
**A:** The Node backend communicates with the Python FastAPI microservice via asynchronous HTTP REST calls with configurable timeouts. If the AI service is ever temporarily unreachable, the Express backend falls back gracefully to a local rule-based matcher so student workflows never halt.

---

### Architecture & Database

#### Q9: Why did you choose MongoDB over a relational database like PostgreSQL?
**A:** Student resumes, technical skill sets, and job postings are semi-structured documents with dynamic attributes (nested weights, proficiency levels, arrays of projects, and certifications). MongoDB provides flexible schema design, fast sub-document queries, and native aggregation pipelines for campus-wide analytics.

#### Q10: Why did you separate the backend into Node.js and Python FastAPI services?
**A:** Separation of concerns. Node.js with Express excels at asynchronous I/O, JWT authentication, real-time polling, and high-concurrency API routing. Python is the industry standard for document parsing (PyMuPDF) and numerical data processing. Keeping them decoupled ensures independent scalability.

#### Q11: How do you prevent duplicate job and internship applications?
**A:** In `Application.js`, we enforce a MongoDB compound unique index: `{ studentId: 1, jobId: 1 }`. If a student attempts to submit a second application to the same job, the database immediately enforces uniqueness and the API returns HTTP 409 Conflict with an explanation.

#### Q12: How do you ensure high performance on large student directories?
**A:** We use database indexes on `{ university: 1, cgpa: -1 }`, lean queries (`.lean()`), and pagination (`skip` and `limit`). Furthermore, application counts are pre-aggregated using MongoDB `$group` stages rather than executing N+1 queries.

---

### Security, Governance & Privacy

#### Q13: How do you protect student privacy and data isolation?
**A:** We enforce database-level tenant isolation:
- Students can only view their own applications (`studentId: req.user.id`).
- Recruiters can only access applicants for jobs they personally created (`job.postedBy: req.user.id`).
- Notifications strictly filter by `{ recipient: req.user.id }`.
Attempts to access peer records result in HTTP 403 Forbidden or HTTP 404 Not Found.

#### Q14: How are passwords and authentication tokens handled?
**A:** Passwords are never saved in plaintext; they are hashed using `bcryptjs` with 10 salt rounds. Authentication uses standard signed JSON Web Tokens (JWT) with 7-day expiration. All protected routes require a valid `Bearer` token verified via middleware.

#### Q15: How does your Company Verification workflow work?
**A:** When a recruiter creates an account, their company is marked as `verified: false` by default. Under our governance model, unverified recruiters are blocked with HTTP 403 Forbidden if they attempt to publish job or internship postings. A University Administrator must review and approve their corporate accreditation before postings go live.

#### Q16: What security headers and protections are implemented?
**A:** We employ `helmet` to enforce strict HTTP headers (CSP, X-Content-Type-Options, Frameguard), `express-rate-limit` to mitigate brute force attacks, input sanitization, and strict CORS configuration tied to the verified frontend client origin.

---

### Institutional & Business Impact

#### Q17: How does this benefit university placement cells?
**A:** Placement cells currently spend weeks manually compiling resumes and tracking spreadsheets. SkillBridge AI automates applicant aggregation, provides verified candidate skill profiles, and enables one-click filtering by CGPA and branch cutoffs.

#### Q18: How does this help the University Academic Council?
**A:** Through the **Curriculum Insights** engine, academic leaders see aggregated skill deficits (e.g. *"Docker has 80% recruiter demand but only 35% student proficiency"*). This provides objective evidence to introduce new lab electives, workshops, or industry guest lectures.

#### Q19: How do corporate recruiters benefit?
**A:** Recruiters waste up to 70% of their screening time filtering resumes with misleading self-reported buzzwords. SkillBridge AI pre-screens and matches candidates based on verified skills, projects, and CGPA, delivering a high-quality applicant pool.

#### Q20: What is your monetization or sustainability model?
**A:** We propose a B2B SaaS model:
- **Universities:** Annual institutional licensing tier for placement automation and curriculum analytics.
- **Enterprises:** Subscription tiers for corporate hiring drives, premium applicant filters, and dedicated branding.
- **Students:** Core matching, learning roadmaps, and applications remain 100% free.

---

### Scalability, Limitations & Future Scope

#### Q21: What are the current limitations of the platform?
**A:** Currently, resume parsing is optimized for standard PDF formats with extractable text layers (scanned image PDFs without OCR are detected and prompted for re-upload). Additionally, coding assessments are self-reported and portfolio-verified; live code execution sandboxes are planned for future phases.

#### Q22: How will you handle scanned image resumes?
**A:** In the future scope, we will integrate Tesseract OCR or Google Cloud Vision API to extract text from scanned images before feeding it into our taxonomy normalizer.

#### Q23: How would you scale the platform to 100,000+ students?
**A:** Both the Node.js backend and FastAPI services are stateless, allowing horizontal container scaling behind an NGINX load balancer. For MongoDB, replica sets and sharding based on `universityId` will distribute database load efficiently.

#### Q24: Can students game the system by stuffing keywords into their resume?
**A:** No. While keyword parsing extracts skills, the **Career Readiness Index** requires practical evidence: 30% of the score is tied to verified GitHub repository links, active project descriptions, and formal certifications. High keyword density without evidence yields a low overall score.

#### Q25: How do you keep learning resource recommendations up to date?
**A:** Recommendations point exclusively to verified, permanent documentation portals (e.g. React documentation, MDN Web Docs, Python.org, Docker documentation). We do not link to fleeting blog posts or unverified third-party courses.

#### Q26: What happens if a recruiter changes a job's status to closed?
**A:** When a job is closed or soft-deleted, it is immediately removed from public student listings. Existing applicants retain their application history, but new applications are rejected with HTTP 400 Bad Request.

#### Q27: How does your notification system avoid overwhelming users?
**A:** Our notification service includes a 2-minute sliding deduplication window for identical event signatures (`recipient + type + relatedEntityId`) and suppresses self-notifications if a user triggers an action on their own record.

#### Q28: What was your biggest technical challenge during development?
**A:** Normalizing skill aliases and ensuring cross-service synchronization. Students might write `JS`, `ReactJS`, or `Docker containerization`. Building a consistent canonical taxonomy across the FastAPI extractor and the Express MongoDB models ensured reliable match scoring and curriculum gap calculations.

#### Q29: What did each member of your 4-person team contribute?
**A:** We divided responsibilities across Frontend Architecture (React/Tailwind/Vite), Backend Core (Express/MongoDB/JWT/RBAC), AI Microservice (FastAPI/PyMuPDF/Taxonomy), and Integration/QA/Security (Automated Suites/Governance/Notifications). Full details are recorded in our official `TEAM_CONTRIBUTIONS.md`.

#### Q30: Why should the judges select SkillBridge AI for the SIH 2026 award?
**A:** Because we built a real, working product, not a superficial prototype. We have 107 passing automated tests, zero mock data, real MongoDB persistence, working tri-service communication, and an authentic solution to Problem SIH26044 that connects students, companies, and universities.

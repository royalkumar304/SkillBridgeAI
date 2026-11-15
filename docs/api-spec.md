# SkillBridge AI — API Specifications (v1 - Updated for Day 3)

Backend Canonical Base URL: `http://localhost:5001/api/v1`  
AI Microservice Base URL: `http://localhost:8000`

---

## 1. Authentication & System Health

### 1.1 Health Check
- **Endpoint:** `GET /health`
- **Auth Required:** No
- **Success Response (200 OK):**
```json
{
  "success": true,
  "service": "SkillBridge Backend API",
  "status": "UP",
  "timestamp": "2026-11-15T07:30:00.000Z",
  "version": "1.0.0"
}
```

### 1.2 User Registration
- **Endpoint:** `POST /auth/register`
- **Auth Required:** No
- **Request Body:**
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "Password@123",
  "role": "STUDENT" // Allowed: "STUDENT", "UNIVERSITY_ADMIN", "RECRUITER"
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "673752e50529d81d45123456",
      "name": "Arjun Sharma",
      "email": "arjun@example.com",
      "role": "STUDENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 User Login
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "arjun@example.com",
  "password": "Password@123"
}
```

### 1.4 Current Authenticated User
- **Endpoint:** `GET /auth/me`
- **Auth Required:** Bearer JWT Token
- **Success Response (200 OK):** Returns authenticated user profile.

---

## 2. Student Profile API (Day 3 Phase 1)

### 2.1 Get Student Profile
- **Endpoint:** `GET /students/profile`
- **Auth Required:** Yes (`STUDENT` gets own profile; `UNIVERSITY_ADMIN` can supply `?userId=<id>`)
- **Query Params:**
  - `userId` (optional, Admin only)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "_id": "673752...",
      "userId": {
        "_id": "673752...",
        "name": "Aarav Sharma",
        "email": "aarav@iitb.ac.in",
        "role": "STUDENT"
      },
      "bio": "Full Stack developer passionate about AI systems",
      "phone": "+91 9876543210",
      "university": "IIT Bombay",
      "degree": "B.Tech",
      "branch": "Computer Science and Engineering",
      "graduationYear": 2026,
      "cgpa": 8.8,
      "careerGoal": "Full Stack AI Engineer",
      "skills": [
        { "name": "React", "level": "advanced", "source": "self_reported" },
        { "name": "Node.js", "level": "intermediate", "source": "self_reported" }
      ],
      "projects": [
        {
          "title": "SkillBridge AI",
          "description": "Academia-industry portal",
          "techStack": ["React", "FastAPI", "Node.js"]
        }
      ],
      "experience": [
        {
          "title": "Frontend Intern",
          "company": "Tech Innovations",
          "duration": "3 months",
          "description": "Built reactive dashboards"
        }
      ],
      "githubUrl": "https://github.com/aarav-sharma",
      "linkedinUrl": "https://linkedin.com/in/aarav-sharma"
    }
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Token missing or invalid
  - `404 Not Found`: Profile not created yet

### 2.2 Create or Update Student Profile
- **Endpoint:** `PUT /students/profile`
- **Auth Required:** Yes (`STUDENT` only)
- **Security:** Controller strictly binds `userId` to the authenticated token claims (`req.user.id`). Any `userId` provided in request body is discarded.
- **Request Body:**
```json
{
  "bio": "Full stack engineer",
  "phone": "+91 9876543210",
  "university": "IIT Bombay",
  "degree": "B.Tech",
  "branch": "Computer Science",
  "graduationYear": 2026,
  "cgpa": 8.8,
  "careerGoal": "Full Stack Engineer",
  "skills": [{ "name": "React", "level": "advanced" }],
  "projects": [{ "title": "Portal", "techStack": ["React", "Node"] }],
  "githubUrl": "https://github.com/aarav",
  "linkedinUrl": "https://linkedin.com/in/aarav"
}
```
- **Success Response (200 OK):** `{ "success": true, "message": "Profile updated successfully", "data": { "profile": { ... } } }`
- **Error Responses:** `400 Validation Error` if required fields fail validation.

### 2.3 Calculate Profile Readiness Index
- **Endpoint:** `GET /students/profile/completion`
- **Auth Required:** Yes (`STUDENT` only)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile completion computed",
  "data": {
    "completionPercent": 100,
    "missingFields": []
  }
}
```

---

## 3. Job Posting API (Day 3 Phase 2)

### 3.1 Create Job Opportunity
- **Endpoint:** `POST /jobs`
- **Auth Required:** Yes (`RECRUITER` only)
- **Request Body:**
```json
{
  "title": "Full Stack MERN Developer Intern",
  "companyName": "TechCorp Innovations",
  "description": "Build high-throughput microservices and reactive interfaces",
  "jobType": "internship", // "internship" | "full_time" | "part_time"
  "location": "Bengaluru / Remote",
  "stipend": "25000",
  "minCGPA": 7.5,
  "allowedBranches": ["CSE", "IT", "ECE"],
  "deadline": "2026-12-31T23:59:59.000Z",
  "status": "active", // "active" | "draft" | "closed"
  "requiredSkills": [
    { "name": "React", "weight": 40, "minimumLevel": "intermediate" },
    { "name": "Node.js", "weight": 35, "minimumLevel": "intermediate" },
    { "name": "MongoDB", "weight": 25, "minimumLevel": "beginner" }
  ],
  "preferredSkills": [{ "name": "Docker" }]
}
```
- **Success Response (201 Created):** `{ "success": true, "data": { "job": { ... } } }`

### 3.2 List Jobs (Public & Recruiter)
- **Endpoint:** `GET /jobs`
- **Auth Required:** Optional
- **Query Params:**
  - `skills`: Comma-separated skill filter (`?skills=React,Node.js`)
  - `location`: Case-insensitive location search (`?location=bengaluru`)
  - `jobType`: Filter by employment type (`?jobType=internship`)
  - `search`: Full text keyword search
  - `myJobs=true`: (Authenticated Recruiter only) returns all jobs posted by the recruiter
- **Success Response (200 OK):** `{ "success": true, "data": { "jobs": [...], "total": 12 } }`

### 3.3 Get Job Details
- **Endpoint:** `GET /jobs/:id`
- **Auth Required:** No
- **Success Response (200 OK):** Returns job details populated with company and recruiter contact.

### 3.4 Get Explainable Job Match Analysis
- **Endpoint:** `GET /jobs/:id/match`
- **Auth Required:** Yes (`STUDENT` only)
- **Description:** Passes student skills and CGPA from profile to FastAPI microservice for explainable matching.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Match analysis computed successfully",
  "data": {
    "profileComplete": true,
    "matchPercentage": 92.5,
    "cgpaEligible": true,
    "matchedSkills": ["React", "Node.js"],
    "missingSkills": ["MongoDB"],
    "breakdown": {
      "skill_match_score": 91.7,
      "cgpa_score": 100.0
    },
    "explanation": "Deterministic weighted scoring: 90% required skills match weight + 10% CGPA eligibility check.",
    "recommendation": "Matches 2 skill(s). Missing: MongoDB."
  }
}
```

### 3.5 Update Job Opportunity
- **Endpoint:** `PUT /jobs/:id`
- **Auth Required:** Yes (`RECRUITER` only; must be `postedBy` author)
- **Error Responses:**
  - `403 Forbidden`: If recruiter attempts to modify another company's posting.

### 3.6 Update Job Status
- **Endpoint:** `PATCH /jobs/:id/status`
- **Auth Required:** Yes (`RECRUITER` only; must be `postedBy` author)
- **Request Body:** `{ "status": "closed" }` (or `"active"`, `"draft"`)

### 3.7 Archive / Delete Job
- **Endpoint:** `DELETE /jobs/:id`
- **Auth Required:** Yes (`RECRUITER` only; must be `postedBy` author)
- **Action:** Sets `status = 'closed'` (soft delete).

---

## 4. Application Engine API (Day 3 Phase 3)

### 4.1 Apply for a Job
- **Endpoint:** `POST /applications`
- **Auth Required:** Yes (`STUDENT` only)
- **Request Body:** `{ "jobId": "673752..." }`
- **Business Logic & Guards:**
  - Checks if job exists and has `status === 'active'` (400 if closed/draft).
  - Checks if deadline has passed (400 if expired).
  - Computes candidate match score via AI microservice.
  - Enforces compound unique index `{ studentId: 1, jobId: 1 }`.
- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "_id": "6738...",
      "studentId": "6737...",
      "jobId": "6736...",
      "status": "applied",
      "matchScore": 92,
      "appliedAt": "2026-11-15T12:00:00.000Z"
    }
  }
}
```
- **Error Responses:**
  - `409 Conflict`: `{"success": false, "error": "Conflict", "message": "You have already applied to this job"}`
  - `400 Bad Request`: Job is closed or deadline passed.

### 4.2 Track My Applications
- **Endpoint:** `GET /applications/my`
- **Auth Required:** Yes (`STUDENT` only)
- **Security:** Returns only applications where `studentId === req.user.id`.
- **Success Response (200 OK):** Returns student's applications populated with job and company data.

### 4.3 View Applicants for a Job
- **Endpoint:** `GET /jobs/:id/applications`
- **Auth Required:** Yes (`RECRUITER` only; must own the job)
- **Security:** Rejects non-owners with `403 Forbidden`.
- **Data Enrichment:** Returns candidates auto-ranked by `matchScore` and attaches their `StudentProfile` (university, CGPA, degree, verified skills).

### 4.4 Update Application Recruitment Status
- **Endpoint:** `PATCH /applications/:id/status`
- **Auth Required:** Yes (`RECRUITER` only; must own the job)
- **Request Body:**
```json
{
  "status": "SHORTLISTED", // Allowed: "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"
  "recruiterFeedback": "Candidate demonstrates strong React and FastAPI competencies."
}
```
- **Success Response (200 OK):** Returns updated application.

---

## 5. AI Microservice Endpoints (Port 8000)

### 5.1 Health Check
- `GET /health` &rarr; `{ "status": "HEALTHY", "service": "SkillBridge AI Microservice" }`

### 5.2 Resume PDF Parser (PyMuPDF)
- `POST /upload-resume-pdf` (Multipart file up to 5MB)
- Returns extracted text, character count, page count, and canonical normalized skills with confidence scores.

### 5.3 Deterministic Weighted Job Matcher
- `POST /match-jobs`
- Computes 90% skills match + 10% CGPA eligibility.

### 5.4 Career Gap Analysis
- `POST /analyze-skill-gap`
- Computes career readiness against industry standard benchmarks.

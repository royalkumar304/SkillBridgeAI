# SkillBridge AI — API Specifications (v1)

Base URL: `http://localhost:5000/api/v1`  
AI Microservice Base URL: `http://localhost:8000`

---

## 1. Authentication & User Management (Backend)

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

---

### 1.2 User Registration
- **Endpoint:** `POST /auth/register`
- **Auth Required:** No
- **Request Body:**
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "Password123!",
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
      "role": "STUDENT",
      "isVerified": false,
      "createdAt": "2026-11-15T07:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Validation Error", "message": "Email already registered"}`
  - `422 Unprocessable Entity`: `{"success": false, "error": "Validation Error", "details": ["Password must be at least 6 characters"]}`

---

### 1.3 User Login
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "arjun@example.com",
  "password": "Password123!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "673752e50529d81d45123456",
      "name": "Arjun Sharma",
      "email": "arjun@example.com",
      "role": "STUDENT",
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: `{"success": false, "error": "Authentication Failed", "message": "Invalid email or password"}`

---

### 1.4 Get Current Authenticated Profile
- **Endpoint:** `GET /auth/me`
- **Auth Required:** Yes (`Bearer <token>`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "673752e50529d81d45123456",
      "name": "Arjun Sharma",
      "email": "arjun@example.com",
      "role": "STUDENT"
    }
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: `{"success": false, "error": "Access Denied", "message": "Invalid or expired token"}`

---

## 2. Python AI Microservice Endpoints (Port 8000)

> **Notice:** The endpoints below are implemented as deterministic, validated mock endpoints for Day 1 and will be linked to PyMuPDF and spaCy NLP pipeline in subsequent phases.

### 2.1 AI Microservice Health
- **Endpoint:** `GET /health`
- **Auth Required:** Optional / Internal
- **Success Response (200 OK):**
```json
{
  "service": "SkillBridge AI Microservice",
  "status": "HEALTHY",
  "version": "1.0.0",
  "active_models": ["mock-ner-v1", "similarity-matcher-v1"]
}
```

---

### 2.2 Skill Extraction from Resume Text
- **Endpoint:** `POST /extract-skills`
- **Auth Required:** No (Internal Service)
- **Request Body:**
```json
{
  "text": "Final year CSE student experienced in React, Node.js, Express, MongoDB, and Tailwind CSS. Built full stack REST APIs and worked with Git."
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "extracted_skills": ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS", "REST API", "Git"],
  "confidence_scores": {
    "React": 0.95,
    "Node.js": 0.92,
    "Express": 0.90,
    "MongoDB": 0.88,
    "Tailwind CSS": 0.94,
    "REST API": 0.85,
    "Git": 0.82
  },
  "extraction_mode": "DAY1_MOCK_CATALOGUE"
}
```
- **Error Response:**
  - `422 Unprocessable Entity`: Missing or empty text body.

---

### 2.3 Job-Candidate Match Score Engine
- **Endpoint:** `POST /match-jobs`
- **Auth Required:** No (Internal Service)
- **Request Body:**
```json
{
  "student_skills": ["React", "JavaScript", "HTML", "CSS"],
  "job_required_skills": [
    { "name": "React", "weight": 35, "minimum_level": "beginner" },
    { "name": "JavaScript", "weight": 35, "minimum_level": "intermediate" },
    { "name": "Node.js", "weight": 30, "minimum_level": "beginner" }
  ],
  "student_cgpa": 8.4,
  "job_min_cgpa": 7.0
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "match_percentage": 70.0,
  "cgpa_eligible": true,
  "matched_skills": ["React", "JavaScript"],
  "missing_skills": ["Node.js"],
  "breakdown": {
    "skill_match_score": 70.0,
    "cgpa_score": 100.0
  },
  "recommendation_summary": "Strong candidate for Frontend requirements; missing backend skill: Node.js."
}
```

---

### 2.4 Skill Gap Analysis
- **Endpoint:** `POST /analyze-skill-gap`
- **Auth Required:** No (Internal Service)
- **Request Body:**
```json
{
  "target_role": "Full Stack Developer",
  "acquired_skills": ["React", "JavaScript", "HTML", "CSS"]
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "target_role": "Full Stack Developer",
  "readiness_score": 60.0,
  "gap_percentage": 40.0,
  "acquired_skills": ["React", "JavaScript", "HTML", "CSS"],
  "missing_critical_skills": ["Node.js", "MongoDB", "Express", "REST API"],
  "recommended_courses": [
    {
      "skill": "Node.js",
      "title": "Backend Development with Node.js & Express",
      "estimated_hours": 20
    },
    {
      "skill": "MongoDB",
      "title": "Data Modeling and MongoDB Aggregations",
      "estimated_hours": 15
    }
  ]
}
```


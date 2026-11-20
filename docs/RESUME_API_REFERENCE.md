# Resume Management API Reference

**Base URL:** `/api/v1/students/resume`  
**Authentication:** Required (`Authorization: Bearer <JWT>`)  

---

### 1. Upload Resume
* **Method:** `POST`
* **Path:** `/api/v1/students/resume`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
* **Role:** `STUDENT`
* **Request Body:** `file` (Binary PDF document, max 5MB)
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully",
  "data": {
    "resume": {
      "id": "67399990abcdef1234567890",
      "filename": "Aarav_Sharma_Resume.pdf",
      "version": 1,
      "fileSize": 145020,
      "extractionStatus": "COMPLETED",
      "extractedSkills": ["React", "Node.js", "MongoDB", "Express", "Python"],
      "uploadedAt": "2026-11-18T00:15:00.000Z"
    }
  }
}
```

---

### 2. View Resumes & History
* **Method:** `GET`
* **Path:** `/api/v1/students/resume`
* **Role:** `STUDENT`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Resumes retrieved successfully",
  "data": {
    "activeResume": {
      "id": "67399990abcdef1234567890",
      "filename": "Aarav_Sharma_Resume.pdf",
      "version": 2,
      "fileSize": 145020,
      "extractionStatus": "COMPLETED",
      "extractedSkills": ["React", "Node.js", "Docker"],
      "uploadedAt": "2026-11-18T00:15:00.000Z",
      "downloadUrl": "/api/v1/students/resume/67399990abcdef1234567890/download"
    },
    "history": [
      {
        "id": "67399990abcdef1234567890",
        "filename": "Aarav_Sharma_Resume.pdf",
        "version": 2,
        "isActive": true,
        "extractionStatus": "COMPLETED",
        "uploadedAt": "2026-11-18T00:15:00.000Z",
        "downloadUrl": "/api/v1/students/resume/67399990abcdef1234567890/download"
      },
      {
        "id": "67388880abcdef1234567890",
        "filename": "Old_Resume.pdf",
        "version": 1,
        "isActive": false,
        "extractionStatus": "COMPLETED",
        "uploadedAt": "2026-11-17T20:00:00.000Z",
        "downloadUrl": "/api/v1/students/resume/67388880abcdef1234567890/download"
      }
    ]
  }
}
```

---

### 3. Download Resume
* **Method:** `GET`
* **Path:** `/api/v1/students/resume/:resumeId/download`
* **Access Rules:**
  * Owning Student: `200 OK`
  * Recruiter with candidate job application: `200 OK`
  * University Administrator: `200 OK`
  * Unauthorized Recruiter or other Student: `403 Forbidden`
* **Response:** Binary Stream (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="<safeFilename>"`)

---

### 4. Delete Resume
* **Method:** `DELETE`
* **Path:** `/api/v1/students/resume/:resumeId`
* **Role:** `STUDENT` (Owner only)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Resume deleted successfully."
}
```
* **Side Effects:** Deletes physical file from private storage, removes MongoDB record, and falls back to latest remaining resume on student profile.

# Resume Storage & Persistence Audit

**Project:** SkillBridge AI (SIH26044)  
**Workspace:** `C:\Users\Lenovo\Desktop\Djano`  
**Date:** November 18, 2026  
**Auditor:** Senior Backend Reliability & Application Security Architect  

---

## 1. Audit Findings Matrix

| Audit Item | Current State | Evidence & File Location | Risk / Status |
| :--- | :---: | :--- | :--- |
| **1. Resume model exists?** | **YES** | `backend/src/models/Resume.js` | Basic model with `studentId`, `fileUrl`, `extractedSkills`, `parsingStatus`. |
| **2. Resume.create() used?** | **NO** | `backend/src/` grep | Model exists in Mongoose registry but was never instantiated or persisted in any controller. |
| **3. Resume metadata in MongoDB?** | **NO** | Database audit | No resume records ever persisted in database; upload was ephemeral to Python microservice. |
| **4. Student profile references?** | **YES** | `backend/src/models/StudentProfile.js` (`resumeId`, `resumeUrl`) | Fields exist in schema, but remained `null` / empty string because backend never stored resumes. |
| **5. PDF upload saves locally?** | **NO** | `backend/src/` & `ai-service/` | FastAPI read bytes in-memory (`await file.read()`), extracted text with PyMuPDF, and discarded buffer. |
| **6. Files downloadable securely?** | **NO** | `backend/src/routes/` | No endpoint existed for retrieving or downloading stored resume PDFs. |
| **7. Ownership on upload/delete?** | **NO** | `backend/src/` | No resume management routes existed on Node.js backend. |
| **8. Old files cleaned up?** | **NO** | `ai-service/` | Files were not persisted, hence no cleanup or retention logic existed. |
| **9. AI extraction linked to record?** | **NO** | `frontend/src/pages/student/StudentDashboard.jsx` | Frontend sent file directly to port 8000; results were held in React state. |
| **10. Extend vs Duplicate?** | **EXTEND** | `backend/src/models/Resume.js`, `backend/src/routes/studentRoutes.js` | Reuse existing `Resume` model (with schema hardening), add `POST /students/resume`, `GET /students/resume`, `GET /students/resume/:resumeId/download`, `DELETE /students/resume/:resumeId`. |

---

## 2. Identified Vulnerabilities & Technical Gaps

1. **Unpersisted Resume Lifecycle:** Students uploaded PDF resumes to FastAPI directly (`POST :8000/upload-resume-pdf`). The backend had zero record of the file, storage key, checksum, or upload date in MongoDB.
2. **Missing Access Control & Retrieval:** Recruiters reviewing applications or students checking their profiles had no authenticated endpoint to view or download uploaded resume PDFs.
3. **Frontend Direct-Call Exposure:** Frontend attempted to call port 8000 directly. With P0 security fix 05 (FastAPI internal service key), direct client calls are blocked with HTTP 401; upload must be brokered through Node.js backend.
4. **No Versioning or Safe Replacement:** Re-uploading a resume had no version tracking or rollback protection.

---

## 3. Architecture Specification for Remediated System

1. **Storage Layer:** Server-side secure local storage abstraction (`backend/src/services/storageService.js`) using random UUID storage keys outside public web roots (`storage/resumes/`), with path traversal protection, SHA-256 checksums, and magic bytes PDF header validation (`%PDF-`).
2. **Data Model:** Enhance `backend/src/models/Resume.js` with `userId`, `originalFilename`, `safeFilename`, `mimeType`, `fileSize`, `storageProvider`, `storageKey`, `checksum`, `extractionStatus`, `extractedSkills`, `isActive`, `version`, `uploadedAt`.
3. **Controller & Routes:** Create `backend/src/controllers/resumeController.js` mounting authenticated routes on `backend/src/routes/studentRoutes.js`.
4. **AI Pipeline Integration:** Node.js backend receives upload -> validates magic bytes and size -> saves to storage -> calls FastAPI (`AIClientService.uploadResumePdf`) -> saves extraction status and skills to `Resume` model in MongoDB -> links `resumeId` to `StudentProfile`.
5. **Ownership & Access Control:**
   * Student can only access/download their own active or historical resumes.
   * Recruiter can only download a student's resume if the student submitted an application to one of the recruiter's company jobs.
   * Path traversal and arbitrary file retrieval are strictly blocked.

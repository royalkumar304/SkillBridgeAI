# Resume Persistence Implementation Guide

**Project:** SkillBridge AI (SIH Problem Statement: SIH26044)  
**Workspace:** `C:\Users\Lenovo\Desktop\Djano`  
**Status:** Remediated & Fully Implemented  

---

## 1. System Architecture

The resume management subsystem brokers authenticated PDF file uploads through the Express REST API, stores documents in a private local filesystem repository outside the webroot, tracks versions and metadata in MongoDB, integrates with the Python FastAPI NLP extraction microservice, and provides access-controlled retrieval.

```
[ Frontend: React / Vite :5173 ]
               │
               │ POST /api/v1/students/resume (multipart/form-data + JWT)
               ▼
[ Backend: Node.js / Express :5001 ]
   ├── Authentication & Role Verification (STUDENT role required)
   ├── Magic Byte & Header Validation (%PDF-, size <= 5MB, .pdf extension)
   ├── Storage Service (Saves file to backend/storage/resumes/<uuid>.pdf)
   ├── MongoDB Resume Persistence (versioning, SHA-256 checksum, userId)
   ├── AIClientService (Forwards stream to FastAPI on port 8000 via internal key)
   └── StudentProfile Association (Links resumeId, resumeUrl, and authentic skills)
               │
               ▼
[ AI Service: Python / FastAPI :8000 ]
   └── NLP Skill Extraction (PyMuPDF + Taxonomy Normalizer)
```

---

## 2. MongoDB Data Model (`Resume.js`)

```javascript
{
  userId: ObjectId (ref: 'User', indexed),
  originalFilename: String (max 255 chars),
  safeFilename: String (sanitized, path traversal stripped),
  mimeType: 'application/pdf',
  fileSize: Number (1 to 5,242,880 bytes),
  storageProvider: 'local' | 's3' | 'gcs',
  storageKey: String (unique UUID),
  checksum: String (SHA-256 hash),
  extractionStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  extractedSkills: [String],
  skillDetails: [{ name, confidence, category, evidence }],
  pageCount: Number,
  characterCount: Number,
  extractedTextPreview: String,
  isActive: Boolean (indexed),
  version: Number (min: 1),
  uploadedAt: Date
}
```

---

## 3. Storage Layer (`StorageService.js`)

* **Private Root:** `backend/storage/resumes/` (mode `0o700`). Never served directly by static file servers.
* **Opaque Key Generation:** Cryptographically random UUID filenames (`${crypto.randomUUID()}.pdf`).
* **Path Traversal Protection:** All storage keys are resolved against `STORAGE_ROOT` using `path.basename()` and path boundary verification.
* **Integrity:** Validates magic bytes `%PDF-` on every upload before saving and computes SHA-256 checksums.

---

## 4. Endpoints & Authorization

* `POST /api/v1/students/resume` — Student uploads a new PDF resume. Creates new incremented version, marks previous active resumes as `isActive: false`, saves metadata, triggers AI extraction, and updates profile.
* `GET /api/v1/students/resume` — Returns current active resume and complete version history for the authenticated student.
* `GET /api/v1/students/resume/:resumeId/download` — Secure streaming download with `Content-Type: application/pdf` and `Content-Disposition`.
  * Accessible by the owning **STUDENT**.
  * Accessible by a **RECRUITER** only if the student has submitted a job application to one of the recruiter's company positions.
  * Accessible by **UNIVERSITY_ADMIN** for audit purposes.
* `DELETE /api/v1/students/resume/:resumeId` — Deletes MongoDB record and deletes the underlying physical file. Automatically rolls active status over to the latest remaining version if the active resume was deleted.

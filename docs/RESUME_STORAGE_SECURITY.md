# Resume Storage Security Architecture

**Project:** SkillBridge AI (SIH26044)  
**Security Standard:** Enterprise File Upload & Multi-Tenant Access Control  

---

## 1. File Upload Threat Model & Mitigations

| Threat | Attack Vector | Security Control |
| :--- | :--- | :--- |
| **Malicious Executables** | Renaming `.exe` or script to `.pdf` | Multi-layer validation: extension check, MIME type check, and magic bytes verification (first 5 bytes must be `%PDF-`). |
| **Path Traversal** | Filenames like `../../../../etc/passwd.pdf` | Physical filenames are completely decoupled from user input. Files are stored as `<uuid>.pdf` via `StorageService.sanitizeFilename()`. |
| **Denial of Service** | Uploading gigabyte files to exhaust storage | Enforced 5MB maximum file size ceiling in streaming parser and storage service. |
| **Metadata Forgery** | Submitting client-controlled `userId`, `storageKey`, or `checksum` in body | Upload handler rejects client metadata; derives `userId` exclusively from the verified JWT claim (`req.user.id`). |
| **Unauthorized File Download** | Guessing or enumerating sequential resume IDs | Resume IDs are 24-character ObjectIds. Endpoints check ownership (`resume.userId === req.user.id`) or explicit consent. |
| **Recruiter Snooping** | Unconsented scraping of candidate resumes | Recruiters are strictly blocked from downloading candidate resumes unless the candidate explicitly submitted an application to the recruiter's active job. |
| **Stale Provenance** | Editing a resume and keeping old extracted skills | Uploading a new resume triggers fresh AI extraction and updates profile skills with authentic `resume_extracted` provenance. |
| **Orphaned Storage Files** | File saved to disk but database transaction crashes | Catch block invokes `StorageService.deleteFile()` if MongoDB persistence fails after file save. |

---

## 2. Access Control Matrix for Resume Files

| Requester Role | Relationship to Candidate | Access Permitted? | Response |
| :--- | :--- | :---: | :---: |
| Unauthenticated Visitor | None | **NO** | `401 Unauthorized` |
| Other Student | Peer | **NO** | `403 Forbidden` |
| Owning Student | Owner | **YES** | `200 OK (Stream PDF)` |
| Recruiter | No application submitted by student | **NO** | `403 Forbidden` |
| Recruiter | Candidate applied to recruiter's job | **YES** | `200 OK (Stream PDF)` |
| University Administrator | Platform Governance | **YES** | `200 OK (Stream PDF)` |

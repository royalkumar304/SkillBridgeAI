# SkillBridge AI — Final Database Schema Specification

**SIH Problem Statement:** SIH26044  
**Database:** MongoDB with Mongoose ODM  

---

## 1. Collections & Relationships

### `users`
* `_id`: ObjectId
* `name`: String, required, trim
* `email`: String, required, unique, lowercase, trim
* `passwordHash`: String, required
* `role`: Enum `['STUDENT', 'RECRUITER', 'UNIVERSITY_ADMIN']`, default: `'STUDENT'`
* `university`: String, trim (used for tenant scoping of admins and students)
* `tokenVersion`: Number, default: 0 (incremented on logout for instant global revocation)
* `status`: Enum `['ACTIVE', 'SUSPENDED', 'PENDING']`, default: `'ACTIVE'`
* `timestamps`: `createdAt`, `updatedAt`

### `studentprofiles`
* `_id`: ObjectId
* `userId`: ObjectId, ref `'User'`, required, unique, index
* `headline`: String, trim
* `bio`: String
* `cgpa`: Number, min: 0.0, max: 10.0
* `graduationYear`: Number, min: 2000, max: 2040
* `university`: String, trim
* `skills`: Array of objects:
  * `name`: String, required, lowercase, trim
  * `level`: Enum `['beginner', 'intermediate', 'advanced', 'expert']`
  * `provenance`: Enum `['self_reported', 'resume_extracted', 'assessment_verified']`
  * `verifiedAt`: Date
* `projects`: Array of `{ title, description, skillsUsed, link }`
* `experience`: Array of `{ company, role, durationMonths, description }`
* `certifications`: Array of `{ name, issuer, year, url }`
* `activeResumeId`: ObjectId, ref `'Resume'`, default: null
* `timestamps`: `createdAt`, `updatedAt`

### `resumes`
* `_id`: ObjectId
* `userId`: ObjectId, ref `'User'`, required, index
* `originalFilename`: String, required (sanitized to remove path traversal)
* `storageKey`: String, required, unique (opaque random UUID filename on disk)
* `mimeType`: String, required (`application/pdf`)
* `fileSizeBytes`: Number, required (max 5MB)
* `checksumSha256`: String, required (64-char hex)
* `extractedSkills`: Array of String
* `version`: Number, required, default: 1
* `isActive`: Boolean, default: true, index
* `timestamps`: `createdAt`, `updatedAt`

### `companies`
* `_id`: ObjectId
* `name`: String, required, unique, trim
* `recruiterUserId`: ObjectId, ref `'User'`, required, index
* `industry`: String, required
* `location`: String, default: `'Remote'`
* `website`: String
* `contactEmail`: String
* `contactPhone`: String
* `verified`: Boolean, default: false, index
* `verificationStatus`: Enum `['PENDING', 'APPROVED', 'REJECTED', 'REVOKED']`, default: `'PENDING'`, index
* `verifiedAt`: Date
* `approvedBy`: ObjectId, ref `'User'`
* `timestamps`: `createdAt`, `updatedAt`

### `jobs`
* `_id`: ObjectId
* `title`: String, required, trim
* `description`: String, required
* `company`: String, required
* `companyId`: ObjectId, ref `'Company'`, required, index
* `postedBy`: ObjectId, ref `'User'`, required, index
* `jobType`: Enum `['full-time', 'internship', 'part-time', 'contract']`, default: `'full-time'`
* `duration`: String (e.g. "6 months" for internships)
* `workMode`: Enum `['remote', 'hybrid', 'onsite']`, default: `'onsite'`
* `location`: String, default: `'Remote'`
* `requiredSkills`: Array of `{ name, weight, minimumLevel }`
* `minCgpa`: Number, default: 0.0
* `deadline`: Date, required
* `status`: Enum `['active', 'draft', 'closed']`, default: `'active'`, index
* `timestamps`: `createdAt`, `updatedAt`

### `applications`
* `_id`: ObjectId
* `studentId`: ObjectId, ref `'User'`, required, index
* `jobId`: ObjectId, ref `'Job'`, required, index
* `status`: Enum `['applied', 'under_review', 'shortlisted', 'rejected', 'selected']`, default: `'applied'`
* `resumeId`: ObjectId, ref `'Resume'`
* `matchScore`: Number, min: 0.0, max: 100.0
* `timestamps`: `createdAt`, `updatedAt`
*(Compound unique index on `{ studentId: 1, jobId: 1 }` prevents duplicate applications, returning HTTP 409)*

### `notifications`
* `_id`: ObjectId
* `recipient`: ObjectId, ref `'User'`, required, index
* `type`: Enum `['APPLICATION_RECEIVED', 'APPLICATION_SHORTLISTED', 'APPLICATION_REJECTED', 'APPLICATION_SELECTED', 'COMPANY_VERIFIED', 'COMPANY_VERIFICATION_REVOKED', 'SYSTEM']`
* `title`: String, required
* `message`: String, required
* `isRead`: Boolean, default: false, index
* `relatedEntityId`: ObjectId
* `timestamps`: `createdAt`, `updatedAt`

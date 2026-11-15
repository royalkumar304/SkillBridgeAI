# SkillBridge AI — Database Schema Specification (Updated for Day 3)

Database: **MongoDB**  
ODM: **Mongoose (v8+)**  
Default Database Name: `skillbridge_ai`

---

## 1. Collection Architecture Overview

| # | Collection Name | Mongoose Model | Primary Key | Key Relationships / Foreign Keys | Compound / Unique Indexes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `users` | `User` | `_id` | Core Auth entity | `{ email: 1 }` (unique) |
| 2 | `studentprofiles` | `StudentProfile` | `_id` | `userId` &rarr; `users._id` | `{ userId: 1 }` (unique) |
| 3 | `companies` | `Company` | `_id` | `recruiterUserId` &rarr; `users._id` | `{ name: 1 }` (unique) |
| 4 | `jobs` | `Job` | `_id` | `companyId` &rarr; `companies._id`, `postedBy` &rarr; `users._id` | `{ status: 1, deadline: 1 }` |
| 5 | `resumes` | `Resume` | `_id` | `studentId` &rarr; `users._id` | — |
| 6 | `applications` | `Application` | `_id` | `studentId` &rarr; `users._id`, `jobId` &rarr; `jobs._id` | `{ studentId: 1, jobId: 1 }` (**unique**) |
| 7 | `skillassessments` | `SkillAssessment` | `_id` | `studentId` &rarr; `users._id` | — |
| 8 | `skillgapreports` | `SkillGapReport` | `_id` | `studentId` &rarr; `users._id` | — |
| 9 | `courses` | `Course` | `_id` | Catalog | — |
| 10 | `recommendations` | `Recommendation` | `_id` | `studentId` &rarr; `users._id` | — |
| 11 | `notifications` | `Notification` | `_id` | `recipientId` &rarr; `users._id` | — |

---

## 2. Updated Core Schemas (Day 3)

### 2.1 StudentProfile (`StudentProfile.js`)
```javascript
{
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  bio: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  university: { type: String, required: true, trim: true, index: true },
  degree: { type: String, required: true, default: 'B.Tech' },
  branch: { type: String, required: true, trim: true },
  graduationYear: { type: Number, required: true, min: 2000, max: 2040 },
  cgpa: { type: Number, min: 0, max: 10, required: true },
  careerGoal: { type: String, default: 'Full Stack Developer', trim: true },
  skills: [{
    name: { type: String, required: true, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    source: { type: String, enum: ['self_reported', 'resume_extracted', 'assessment_verified'], default: 'self_reported' },
    verifiedAt: { type: Date }
  }],
  projects: [{
    title: { type: String, required: true, trim: true },
    description: { type: String },
    techStack: [{ type: String, trim: true }],
    githubUrl: { type: String, trim: true },
    liveUrl: { type: String, trim: true }
  }],
  certifications: [{
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: Date },
    credentialUrl: { type: String }
  }],
  experience: [{
    title: { type: String, required: true },
    company: { type: String, required: true },
    duration: { type: String },
    description: { type: String }
  }],
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },
  resumeUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '', trim: true },
  linkedinUrl: { type: String, default: '', trim: true },
  timestamps: true
}
```

### 2.2 Job (`Job.js`)
```javascript
{
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false, index: true },
  companyName: { type: String, trim: true, default: 'SkillBridge Partner' },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  jobType: { type: String, enum: ['internship', 'full_time', 'part_time'], default: 'internship' },
  location: { type: String, default: 'Remote' },
  stipend: { type: String, default: 'Unpaid / Performance Stipend' },
  requiredSkills: [{
    name: { type: String, required: true, trim: true },
    weight: { type: Number, min: 1, max: 100, default: 20 },
    minimumLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
  }],
  preferredSkills: [{
    name: { type: String, trim: true }
  }],
  minCGPA: { type: Number, min: 0, max: 10, default: 6.0 },
  allowedBranches: [{ type: String, trim: true }],
  eligibleDegrees: [{ type: String, trim: true }],
  eligibleGraduationYears: [{ type: Number }],
  deadline: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft', 'published', 'DRAFT', 'PUBLISHED', 'CLOSED', 'ACTIVE'],
    default: 'active',
    index: true
  },
  postedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  timestamps: true
}
```

### 2.3 Application (`Application.js`)
```javascript
{
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  matchScore: { type: Number, min: 0, max: 100, default: 0 },
  status: {
    type: String,
    enum: [
      'applied',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'rejected',
      'selected'
    ],
    default: 'applied',
    index: true
  },
  interviewDate: { type: Date, default: null },
  recruiterFeedback: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now },
  timestamps: true
}

// Compound Unique Index: Prevents duplicate applications
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
```

# SkillBridge AI — Database Schema Specification

Database: **MongoDB**  
ODM: **Mongoose (v8+)**  
Default Database Name: `skillbridge_ai`

---

## 1. Collection Architecture Overview

| # | Collection Name | Mongoose Model | Primary Key | Key Relationships / Foreign Keys |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `users` | `User` | `_id` | Core Auth entity |
| 2 | `studentprofiles` | `StudentProfile` | `_id` | `userId` &rarr; `users._id` |
| 3 | `companies` | `Company` | `_id` | `recruiterUserId` &rarr; `users._id` |
| 4 | `jobs` | `Job` | `_id` | `companyId` &rarr; `companies._id` |
| 5 | `resumes` | `Resume` | `_id` | `studentId` &rarr; `users._id` |
| 6 | `applications` | `Application` | `_id` | `studentId` &rarr; `users._id`, `jobId` &rarr; `jobs._id` |
| 7 | `skillassessments` | `SkillAssessment` | `_id` | `studentId` &rarr; `users._id` |
| 8 | `skillgapreports` | `SkillGapReport` | `_id` | `studentId` &rarr; `users._id` |
| 9 | `courses` | `Course` | `_id` | Catalog |
| 10 | `recommendations` | `Recommendation` | `_id` | `studentId` &rarr; `users._id` |
| 11 | `notifications` | `Notification` | `_id` | `recipientId` &rarr; `users._id` |

---

## 2. Detailed Schemas

### 2.1 User (`User.js`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { 
    type: String, 
    required: true, 
    enum: ['STUDENT', 'UNIVERSITY_ADMIN', 'RECRUITER'], 
    default: 'STUDENT',
    index: true 
  },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'PENDING'], default: 'ACTIVE' },
  timestamps: true
}
```

### 2.2 StudentProfile (`StudentProfile.js`)
```javascript
{
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  university: { type: String, required: true, trim: true },
  degree: { type: String, required: true, default: 'B.Tech' },
  branch: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  cgpa: { type: Number, min: 0, max: 10, required: true },
  careerGoal: { type: String, default: 'Full Stack Developer' },
  skills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    source: { type: String, enum: ['self_reported', 'resume_extracted', 'assessment_verified'], default: 'self_reported' },
    verifiedAt: { type: Date }
  }],
  projects: [{
    title: { type: String, required: true },
    description: String,
    techStack: [String],
    githubUrl: String,
    liveUrl: String
  }],
  certifications: [{
    title: String,
    issuer: String,
    issueDate: Date,
    credentialUrl: String
  }],
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  timestamps: true
}
```

### 2.3 Company (`Company.js`)
```javascript
{
  name: { type: String, required: true, trim: true, unique: true },
  website: { type: String, trim: true },
  industry: { type: String, required: true },
  description: { type: String },
  location: { type: String, default: 'Remote' },
  verified: { type: Boolean, default: false, index: true },
  recruiterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timestamps: true
}
```

### 2.4 Job (`Job.js`)
```javascript
{
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  jobType: { type: String, enum: ['internship', 'full_time', 'part_time'], default: 'internship' },
  location: { type: String, default: 'Remote' },
  stipend: { type: String, default: 'Unpaid' },
  requiredSkills: [{
    name: { type: String, required: true },
    weight: { type: Number, min: 1, max: 100, default: 20 },
    minimumLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
  }],
  minCGPA: { type: Number, min: 0, max: 10, default: 6.0 },
  allowedBranches: [String],
  deadline: { type: Date, required: true, index: true },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active', index: true },
  timestamps: true
}
```

### 2.5 Resume (`Resume.js`)
```javascript
{
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileUrl: { type: String, required: true },
  extractedSkills: [String],
  extractedExperience: [{
    company: String,
    role: String,
    duration: String,
    highlights: [String]
  }],
  parsingStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  uploadedAt: { type: Date, default: Date.now }
}
```

### 2.6 Application (`Application.js`)
```javascript
{
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  matchScore: { type: Number, min: 0, max: 100, default: 0 },
  status: { 
    type: String, 
    enum: ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'rejected', 'selected'], 
    default: 'applied',
    index: true 
  },
  interviewDate: { type: Date, default: null },
  recruiterFeedback: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now }
}
// COMPOUND INDEX TO PREVENT DUPLICATE APPLICATIONS:
ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
```

### 2.7 SkillAssessment (`SkillAssessment.js`)
```javascript
{
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  skillName: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  passed: { type: Boolean, required: true },
  assessedLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  attemptedAt: { type: Date, default: Date.now }
}
```

### 2.8 SkillGapReport (`SkillGapReport.js`)
```javascript
{
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetRole: { type: String, required: true },
  gapPercentage: { type: Number, min: 0, max: 100, required: true },
  currentSkills: [String],
  missingSkills: [String],
  priorityActions: [String],
  generatedAt: { type: Date, default: Date.now }
}
```

### 2.9 Course (`Course.js`)
```javascript
{
  title: { type: String, required: true, trim: true },
  provider: { type: String, required: true },
  skillTaught: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  durationHours: { type: Number, default: 10 },
  courseUrl: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, default: 4.5 }
}
```

### 2.10 Recommendation (`Recommendation.js`)
```javascript
{
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['JOB', 'COURSE', 'PROJECT'], required: true },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  matchScore: { type: Number, min: 0, max: 100, required: true },
  reason: { type: String, required: true },
  isViewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

### 2.11 Notification (`Notification.js`)
```javascript
{
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['APPLICATION_STATUS', 'INTERVIEW_ALERT', 'SKILL_GAP_ALERT', 'JOB_RECOMMENDATION'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
}
```


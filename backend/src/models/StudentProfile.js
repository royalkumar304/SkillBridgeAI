const mongoose = require('mongoose');

const skillItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    source: {
      type: String,
      enum: ['self_reported', 'resume_extracted', 'assessment_verified'],
      default: 'self_reported',
    },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const projectItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    techStack: [{ type: String, trim: true }],
    githubUrl: { type: String, trim: true },
    liveUrl: { type: String, trim: true },
  },
  { _id: false }
);

const certificationItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date },
    credentialUrl: { type: String, trim: true },
  },
  { _id: false }
);

const experienceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    duration: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    university: {
      type: String,
      required: [true, 'University name is required'],
      trim: true,
      index: true,
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      default: 'B.Tech',
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch / Specialization is required'],
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required'],
      min: [2000, 'Invalid graduation year'],
      max: [2040, 'Invalid graduation year'],
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be below 0'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    careerGoal: {
      type: String,
      default: 'Full Stack Developer',
      trim: true,
    },
    skills: [skillItemSchema],
    projects: [projectItemSchema],
    certifications: [certificationItemSchema],
    experience: [experienceItemSchema],
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    resumeUrl: { type: String, default: '', trim: true },
    githubUrl: { type: String, default: '', trim: true },
    linkedinUrl: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
  }
);

studentProfileSchema.index({ 'skills.name': 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);


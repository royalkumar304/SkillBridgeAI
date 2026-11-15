const mongoose = require('mongoose');

const requiredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    weight: {
      type: Number,
      min: 1,
      max: 100,
      default: 20,
    },
    minimumLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: 'SkillBridge Partner',
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    jobType: {
      type: String,
      enum: ['internship', 'full_time', 'part_time'],
      default: 'internship',
    },
    location: {
      type: String,
      default: 'Remote',
    },
    stipend: {
      type: String,
      default: 'Unpaid / Performance Stipend',
    },
    requiredSkills: {
      type: [requiredSkillSchema],
      validate: {
        validator: function (skills) {
          return skills && skills.length > 0;
        },
        message: 'A job must specify at least one required skill',
      },
    },
    preferredSkills: [
      {
        name: { type: String, trim: true },
      },
    ],
    minCGPA: {
      type: Number,
      min: 0,
      max: 10,
      default: 6.0,
    },
    allowedBranches: [{ type: String, trim: true }],
    eligibleDegrees: [{ type: String, trim: true }],
    eligibleGraduationYears: [{ type: Number }],
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft', 'published', 'DRAFT', 'PUBLISHED', 'CLOSED', 'ACTIVE'],
      default: 'active',
      index: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ 'requiredSkills.name': 1 });

module.exports = mongoose.model('Job', jobSchema);


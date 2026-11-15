const mongoose = require('mongoose');

const experienceItemSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    duration: { type: String, trim: true },
    highlights: [{ type: String }],
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Resume file URL or path is required'],
    },
    extractedSkills: [{ type: String, trim: true }],
    extractedExperience: [experienceItemSchema],
    parsingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);


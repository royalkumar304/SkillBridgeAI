const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'applied',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'rejected',
        'selected',
      ],
      default: 'applied',
      index: true,
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    recruiterFeedback: {
      type: String,
      default: '',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// COMPOUND UNIQUE INDEX: Prevent duplicate applications from same student to same job
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);


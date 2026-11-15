const mongoose = require('mongoose');

const skillAssessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillName: {
      type: String,
      required: [true, 'Assessed skill name is required'],
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    assessedLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

skillAssessmentSchema.index({ studentId: 1, skillName: 1 });

module.exports = mongoose.model('SkillAssessment', skillAssessmentSchema);


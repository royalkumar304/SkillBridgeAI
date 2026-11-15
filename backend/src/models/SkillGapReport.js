const mongoose = require('mongoose');

const skillGapReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: [true, 'Target career role is required'],
      trim: true,
    },
    gapPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    currentSkills: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    priorityActions: [{ type: String, trim: true }],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SkillGapReport', skillGapReportSchema);


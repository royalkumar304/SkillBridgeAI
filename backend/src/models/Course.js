const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    provider: {
      type: String,
      required: [true, 'Course provider is required'],
      trim: true,
    },
    skillTaught: {
      type: String,
      required: [true, 'Target skill taught is required'],
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    durationHours: {
      type: Number,
      default: 10,
    },
    courseUrl: {
      type: String,
      required: [true, 'Course URL is required'],
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', courseSchema);


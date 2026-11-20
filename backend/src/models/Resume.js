const mongoose = require('mongoose');

const skillDetailSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    category: { type: String, trim: true, default: 'General' },
    evidence: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    safeFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf'],
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      required: true,
      min: [1, 'File size must be greater than 0 bytes'],
      max: [5 * 1024 * 1024, 'File size exceeds maximum limit of 5MB'],
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'gcs'],
      default: 'local',
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    checksum: {
      type: String,
      required: true,
      trim: true,
    },
    extractionStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    extractedSkills: [{ type: String, trim: true }],
    skillDetails: [skillDetailSchema],
    pageCount: { type: Number, default: 1 },
    characterCount: { type: Number, default: 0 },
    extractedTextPreview: { type: String, default: '', trim: true },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
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

// Unique compound partial index to guarantee at most one active resume per student at DB level
resumeSchema.index(
  { userId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
resumeSchema.index({ userId: 1, version: -1 });

module.exports = mongoose.model('Resume', resumeSchema);

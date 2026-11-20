const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      required: [true, 'Industry classification is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
      default: 'PENDING',
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recruiterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook ensuring strict synchronization between verified (boolean) and verificationStatus (enum)
companySchema.pre('save', function (next) {
  // If verified was explicitly set to true and verificationStatus wasn't modified to a non-APPROVED state
  if (this.isModified('verified') && this.verified === true && !this.isModified('verificationStatus')) {
    this.verificationStatus = 'APPROVED';
    if (!this.verifiedAt) this.verifiedAt = new Date();
  } else if (this.verificationStatus === 'APPROVED') {
    this.verified = true;
    if (!this.verifiedAt) this.verifiedAt = new Date();
  } else if (['REJECTED', 'REVOKED', 'PENDING'].includes(this.verificationStatus)) {
    this.verified = false;
  } else if (this.verified === true) {
    this.verificationStatus = 'APPROVED';
    if (!this.verifiedAt) this.verifiedAt = new Date();
  } else {
    this.verified = false;
    if (!this.verificationStatus) this.verificationStatus = 'PENDING';
  }
  next();
});

module.exports = mongoose.model('Company', companySchema);


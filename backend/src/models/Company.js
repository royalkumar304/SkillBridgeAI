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
    verified: {
      type: Boolean,
      default: false,
      index: true,
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

module.exports = mongoose.model('Company', companySchema);


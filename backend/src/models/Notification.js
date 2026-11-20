const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Backwards compatibility alias for recipientId if queried
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'APPLICATION_SUBMITTED',
        'APPLICATION_RECEIVED',
        'APPLICATION_STATUS_CHANGED',
        'APPLICATION_SHORTLISTED',
        'APPLICATION_REJECTED',
        'APPLICATION_SELECTED',
        'APPLICATION_UNDER_REVIEW',
        'INTERVIEW_SCHEDULED',
        'COMPANY_VERIFIED',
        'COMPANY_VERIFICATION_REVOKED',
        'COMPANY_APPROVAL_PENDING',
        'NEW_MATCHING_JOB',
        // Legacy enum types
        'APPLICATION_STATUS',
        'INTERVIEW_ALERT',
        'SKILL_GAP_ALERT',
        'JOB_RECOMMENDATION',
      ],
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required'],
      trim: true,
      maxlength: 1000,
    },
    relatedEntityType: {
      type: String,
      enum: ['Application', 'Job', 'Company', 'StudentProfile', 'System', null],
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

// Pre-save hook to synchronize recipient & recipientId
notificationSchema.pre('save', function (next) {
  if (this.recipient && !this.recipientId) {
    this.recipientId = this.recipient;
  } else if (this.recipientId && !this.recipient) {
    this.recipient = this.recipientId;
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);

/**
 * Reusable Notification Service
 * Encapsulates safe creation, deduplication, and event notifications.
 */

const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates a notification safely. Never throws or halts caller workflow.
 */
async function createNotification(data) {
  try {
    if (!data.recipient || !mongoose.Types.ObjectId.isValid(data.recipient)) {
      console.warn('[notificationService.createNotification] Missing or invalid recipient ID:', data.recipient);
      return null;
    }

    // Avoid self-notification
    if (data.actor && data.recipient.toString() === data.actor.toString()) {
      return null;
    }

    // Deduplication check: prevent identical notification within 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existing = await Notification.findOne({
      recipient: data.recipient,
      type: data.type,
      relatedEntityId: data.relatedEntityId || null,
      createdAt: { $gte: twoMinutesAgo },
    });

    if (existing) {
      return existing;
    }

    const notification = await Notification.create({
      recipient: data.recipient,
      recipientId: data.recipient,
      actor: data.actor || null,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntityType: data.relatedEntityType || null,
      relatedEntityId: data.relatedEntityId || null,
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error('[notificationService.createNotification] Failed to create notification:', error.message);
    return null;
  }
}

/**
 * Notify when a student submits an application.
 * Recipient: The recruiter who posted the job.
 */
async function notifyApplicationSubmitted({ application, job, studentUser }) {
  try {
    if (!job || !job.postedBy) return null;

    const recruiterId = job.postedBy._id || job.postedBy;
    const applicantName = studentUser?.name || 'A candidate';

    return await createNotification({
      recipient: recruiterId,
      actor: studentUser?._id || studentUser?.id,
      type: 'APPLICATION_RECEIVED',
      title: 'New Application Received',
      message: `${applicantName} submitted an application for "${job.title}".`,
      relatedEntityType: 'Application',
      relatedEntityId: application._id,
    });
  } catch (err) {
    console.error('[notificationService.notifyApplicationSubmitted]', err.message);
    return null;
  }
}

/**
 * Notify when an application status changes.
 * Recipient: The applicant student.
 */
async function notifyApplicationStatusChanged({ application, job, newStatus, recruiterUser }) {
  try {
    const studentId = application.studentId?._id || application.studentId;
    if (!studentId) return null;

    const jobTitle = job?.title || 'your application';
    let type = 'APPLICATION_STATUS_CHANGED';
    let title = 'Application Status Updated';
    let message = `Your application for "${jobTitle}" is now marked as ${newStatus}.`;

    const norm = (newStatus || '').toLowerCase();
    if (norm === 'shortlisted') {
      type = 'APPLICATION_SHORTLISTED';
      title = 'Application Shortlisted! 🎉';
      message = `Congratulations! You have been shortlisted for "${jobTitle}".`;
    } else if (norm === 'rejected') {
      type = 'APPLICATION_REJECTED';
      title = 'Application Status Update';
      message = `Your application for "${jobTitle}" was not selected. Check out new openings!`;
    } else if (norm === 'selected') {
      type = 'APPLICATION_SELECTED';
      title = 'Selected for Offer! 🌟';
      message = `Congratulations! You have been selected for "${jobTitle}".`;
    } else if (norm === 'under_review') {
      type = 'APPLICATION_UNDER_REVIEW';
      title = 'Application Under Review';
      message = `Your application for "${jobTitle}" is currently under review by the hiring team.`;
    } else if (norm === 'interview_scheduled') {
      type = 'INTERVIEW_SCHEDULED';
      title = 'Interview Scheduled 🗓️';
      message = `An interview has been scheduled for your application to "${jobTitle}".`;
    }

    return await createNotification({
      recipient: studentId,
      actor: recruiterUser?._id || recruiterUser?.id || null,
      type,
      title,
      message,
      relatedEntityType: 'Application',
      relatedEntityId: application._id,
    });
  } catch (err) {
    console.error('[notificationService.notifyApplicationStatusChanged]', err.message);
    return null;
  }
}

/**
 * Notify recruiter when their company is verified by Admin.
 */
async function notifyCompanyVerified({ company, adminUser }) {
  try {
    if (!company || !company.recruiterUserId) return null;

    const recruiterId = company.recruiterUserId._id || company.recruiterUserId;

    return await createNotification({
      recipient: recruiterId,
      actor: adminUser?._id || adminUser?.id || null,
      type: 'COMPANY_VERIFIED',
      title: 'Company Verification Approved! ✅',
      message: `Your company "${company.name}" has been verified by the University Administration. You can now publish active job postings.`,
      relatedEntityType: 'Company',
      relatedEntityId: company._id,
    });
  } catch (err) {
    console.error('[notificationService.notifyCompanyVerified]', err.message);
    return null;
  }
}

/**
 * Notify recruiter when company verification is revoked.
 */
async function notifyCompanyVerificationRevoked({ company, adminUser }) {
  try {
    if (!company || !company.recruiterUserId) return null;

    const recruiterId = company.recruiterUserId._id || company.recruiterUserId;

    return await createNotification({
      recipient: recruiterId,
      actor: adminUser?._id || adminUser?.id || null,
      type: 'COMPANY_VERIFICATION_REVOKED',
      title: 'Company Verification Revoked ⚠️',
      message: `Verification for "${company.name}" has been revoked by the University Administration. Job publishing is paused.`,
      relatedEntityType: 'Company',
      relatedEntityId: company._id,
    });
  } catch (err) {
    console.error('[notificationService.notifyCompanyVerificationRevoked]', err.message);
    return null;
  }
}

/**
 * Notify university admins when a new company registers and awaits approval.
 */
async function notifyCompanyApprovalPending({ company, recruiterUser }) {
  try {
    // Find all active University Admin accounts
    const admins = await User.find({ role: 'UNIVERSITY_ADMIN' }, '_id');
    if (!admins || admins.length === 0) return [];

    const promises = admins.map((admin) =>
      createNotification({
        recipient: admin._id,
        actor: recruiterUser?._id || recruiterUser?.id || null,
        type: 'COMPANY_APPROVAL_PENDING',
        title: 'New Partner Awaiting Approval',
        message: `Company "${company.name}" registered and is pending accreditation verification.`,
        relatedEntityType: 'Company',
        relatedEntityId: company._id,
      })
    );

    return await Promise.all(promises);
  } catch (err) {
    console.error('[notificationService.notifyCompanyApprovalPending]', err.message);
    return [];
  }
}

module.exports = {
  createNotification,
  notifyApplicationSubmitted,
  notifyApplicationStatusChanged,
  notifyCompanyVerified,
  notifyCompanyVerificationRevoked,
  notifyCompanyApprovalPending,
};

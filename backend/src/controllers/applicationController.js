/**
 * Application Controller
 * Handles student job applications and recruiter applicant management.
 */

const Application = require('../models/Application');
const Job = require('../models/Job');
const StudentProfile = require('../models/StudentProfile');
const AIClientService = require('../services/aiClientService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const {
  notifyApplicationSubmitted,
  notifyApplicationStatusChanged,
} = require('../services/notificationService');

const normalizeAppStatus = (status) => {
  if (!status) return 'applied';
  const s = status.toLowerCase().replace(/[\s-]/g, '_');
  return s;
};

/**
 * POST /api/v1/applications
 * STUDENT only — apply to a job
 */
const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return errorResponse(res, 400, 'Validation Error', 'jobId is required');
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    const activeStatuses = ['active', 'published', 'ACTIVE', 'PUBLISHED'];
    if (!activeStatuses.includes(job.status)) {
      return errorResponse(res, 400, 'Bad Request', 'Job is not accepting applications (status: closed/draft)');
    }

    // Verify company accreditation before accepting applications (canonical policy)
    if (job.companyId) {
      const { isCompanyVerified } = require('../utils/verificationPolicy');
      const company = await require('../models/Company').findById(job.companyId);
      if (!isCompanyVerified(company)) {
        return errorResponse(res, 403, 'Forbidden', 'This job belongs to an unaccredited or revoked company and is not accepting applications');
      }
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return errorResponse(res, 400, 'Bad Request', 'Application deadline has passed');
    }

    let calculatedScore = 0;
    try {
      const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
      if (studentProfile && studentProfile.skills && studentProfile.skills.length > 0) {
        const studentSkills = studentProfile.skills.map((s) => s.name);
        const jobSkills = (job.requiredSkills || []).map((s) => ({
          name: s.name,
          weight: s.weight || 20,
          minimum_level: s.minimumLevel || 'beginner',
        }));

        const aiResult = await AIClientService.matchJob(
          studentSkills,
          jobSkills,
          studentProfile.cgpa || 7.0,
          job.minCGPA || 6.0
        );

        if (aiResult && typeof aiResult.match_percentage === 'number') {
          calculatedScore = Math.round(aiResult.match_percentage);
        }
      }
    } catch (aiErr) {
      console.warn('[applicationController.createApplication] Non-blocking AI match score calculation failed:', aiErr.message);
    }

    const application = await Application.create({
      studentId: req.user.id,
      jobId,
      status: 'applied',
      matchScore: calculatedScore,
      appliedAt: new Date(),
    });

    // Notification to the recruiter who owns the job
    await notifyApplicationSubmitted({
      application,
      job,
      studentUser: req.user,
    });

    return successResponse(res, 201, 'Application submitted successfully', {
      application,
      matchScore: calculatedScore,
    });
  } catch (error) {
    console.error('[applicationController.createApplication]', error);

    // Compound unique index on { studentId: 1, jobId: 1 } violation
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Conflict', 'You have already applied to this job');
    }

    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/applications/my
 * STUDENT only — list own applications, populated with job details
 */
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.user.id })
      .populate({
        path: 'jobId',
        select: 'title companyId companyName location jobType stipend deadline status requiredSkills',
        populate: { path: 'companyId', select: 'name logo industry' },
      })
      .sort({ appliedAt: -1, createdAt: -1 });

    return successResponse(res, 200, 'Applications retrieved successfully', {
      applications,
      total: applications.length,
    });
  } catch (error) {
    console.error('[applicationController.getMyApplications]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/jobs/:id/applications
 * RECRUITER only — list all applications for a job they posted
 */
const getJobApplications = async (req, res) => {
  try {
    if (!require('mongoose').Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid job ID format');
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only view applications for jobs you posted');
    }

    const applications = await Application.find({ jobId: req.params.id })
      .populate('studentId', 'name email role')
      .sort({ matchScore: -1, appliedAt: 1 });

    // Enrich applicants with StudentProfile data
    const studentUserIds = applications.map((a) => a.studentId?._id).filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: studentUserIds } });
    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.userId.toString(), p);
    });

    const enrichedApplications = applications.map((app) => {
      const appObj = app.toObject();
      const studentIdStr = app.studentId?._id?.toString();
      if (studentIdStr && profileMap.has(studentIdStr)) {
        appObj.studentProfile = profileMap.get(studentIdStr);
      }
      return appObj;
    });

    return successResponse(res, 200, 'Applications retrieved successfully', {
      applications: enrichedApplications,
      total: enrichedApplications.length,
      job: {
        _id: job._id,
        title: job.title,
        status: job.status,
        deadline: job.deadline,
        requiredSkills: job.requiredSkills,
      },
    });
  } catch (error) {
    console.error('[applicationController.getJobApplications]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PATCH /api/v1/applications/:id/status
 * RECRUITER only — update application status (e.g. APPLIED, UNDER_REVIEW, SHORTLISTED, REJECTED, SELECTED)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, recruiterFeedback } = req.body;

    if (!status) {
      return errorResponse(res, 400, 'Validation Error', 'status is required');
    }

    if (!require('mongoose').Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid application ID format');
    }

    const normalized = normalizeAppStatus(status);
    const validStatuses = [
      'applied',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'rejected',
      'selected',
    ];

    if (!validStatuses.includes(normalized)) {
      return errorResponse(
        res,
        400,
        'Validation Error',
        `status must be one of: ${validStatuses.join(', ')} (or uppercase equivalents)`
      );
    }

    const application = await Application.findById(req.params.id).populate('jobId');

    if (!application) {
      return errorResponse(res, 404, 'Not Found', 'Application not found');
    }

    const job = application.jobId;

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Associated job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only update applications for jobs you posted');
    }

    const previousStatus = application.status;
    application.status = normalized;
    if (recruiterFeedback !== undefined) {
      application.recruiterFeedback = recruiterFeedback;
    }
    await application.save();

    // Trigger notification to student if status actually transitioned (deduplication)
    if (previousStatus !== normalized) {
      await notifyApplicationStatusChanged({
        application,
        job,
        newStatus: normalized,
        recruiterUser: req.user,
      });
    }

    return successResponse(res, 200, 'Application status updated successfully', { application });
  } catch (error) {
    console.error('[applicationController.updateApplicationStatus]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
};

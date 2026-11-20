/**
 * Job Controller
 * Handles CRUD and matching for job postings.
 */

const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');
const StudentProfile = require('../models/StudentProfile');
const AIClientService = require('../services/aiClientService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { notifyCompanyApprovalPending } = require('../services/notificationService');
const { isCompanyVerified, getVerifiedCompanyQuery } = require('../utils/verificationPolicy');
const { createSafeSearchRegex, parsePagination, parseSorting } = require('../utils/querySanitizer');
const { serializeJob } = require('../utils/responseSerializers');

/**
 * Normalizes status strings (e.g. 'published' -> 'active')
 */
const normalizeStatus = (status) => {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (s === 'published') return 'active';
  return s;
};

/**
 * POST /api/v1/jobs
 * RECRUITER only — create a new job posting
 */
const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      companyId,
      companyName,
      jobType,
      location,
      stipend,
      duration,
      workMode,
      requiredSkills,
      preferredSkills,
      minCGPA,
      allowedBranches,
      eligibleDegrees,
      eligibleGraduationYears,
      deadline,
      status,
    } = req.body;

    if (!title || !description || !requiredSkills || !deadline) {
      return errorResponse(
        res,
        400,
        'Validation Error',
        'Missing required fields: title, description, requiredSkills, deadline'
      );
    }

    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return errorResponse(
        res,
        400,
        'Validation Error',
        'A job must specify at least one required skill'
      );
    }

    // Resolve company reference with strict recruiter-to-company ownership authorization
    let company = null;

    if (companyId !== undefined && companyId !== null && companyId !== '') {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return errorResponse(res, 400, 'Validation Error', 'Invalid companyId format');
      }
      company = await Company.findById(companyId);
      if (!company) {
        return errorResponse(res, 404, 'Not Found', 'Specified company does not exist');
      }
      // Strict ownership check: Recruiter must be the registered owner of this company
      if (!company.recruiterUserId || company.recruiterUserId.toString() !== req.user.id) {
        return errorResponse(
          res,
          403,
          'Forbidden',
          'You are not authorized to create or manage job postings for this company'
        );
      }
    } else {
      // Find or auto-provision company belonging to the authenticated recruiter
      company = await Company.findOne({ recruiterUserId: req.user.id });
      if (!company) {
        const uniqueName = companyName || `${req.user.name || 'Recruiter'} Enterprises (${Date.now()})`;
        try {
          company = await Company.create({
            name: uniqueName,
            industry: 'Technology',
            recruiterUserId: req.user.id,
            location: location || 'Remote',
            verified: false // Unverified by default pending University Admin approval
          });
          // Notify University Admins about new partner registration
          notifyCompanyApprovalPending({ company, recruiterUser: req.user }).catch((err) =>
            console.warn('[createJob] Admin notification failed:', err.message)
          );
        } catch (compErr) {
          company = await Company.findOne({ recruiterUserId: req.user.id });
        }
      }
    }

    if (!company) {
      return errorResponse(res, 404, 'Not Found', 'Unable to resolve or create company for recruiter');
    }

    const targetCompanyId = company._id;
    const resolvedCompanyName = company.name;

    // COMPANY APPROVAL GATE:
    // If the company is not verified by University Admin, block publishing
    if (!isCompanyVerified(company)) {
      return errorResponse(
        res,
        403,
        'Company Verification Required',
        'Your company is pending verification by the University Admin. Job postings cannot be published until approved.'
      );
    }

    const job = await Job.create({
      title,
      description,
      companyId: targetCompanyId,
      companyName: resolvedCompanyName,
      jobType: jobType || 'internship',
      location: location || 'Remote',
      stipend: stipend ? String(stipend) : 'Unpaid / Performance Stipend',
      duration: duration || '3 Months',
      workMode: workMode || 'remote',
      requiredSkills,
      preferredSkills: preferredSkills || [],
      minCGPA: minCGPA !== undefined ? Number(minCGPA) : 6.0,
      allowedBranches: allowedBranches || [],
      eligibleDegrees: eligibleDegrees || [],
      eligibleGraduationYears: eligibleGraduationYears || [],
      deadline: new Date(deadline),
      status: normalizeStatus(status),
      postedBy: req.user.id,
    });

    return successResponse(res, 201, 'Job created successfully', { job });
  } catch (error) {
    console.error('[jobController.createJob]', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, 'Validation Error', error.message, error.errors);
    }
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/jobs
 * Returns jobs with optional filters: ?skills=&location=&jobType=&search=&myJobs=true&page=&limit=
 * - If myJobs=true and user is recruiter: returns all jobs posted by that recruiter
 * - Otherwise: returns active/published jobs
 */
const getJobs = async (req, res) => {
  try {
    const filter = {};

    if (req.query.myJobs === 'true' && req.user && req.user.role === 'RECRUITER') {
      filter.postedBy = req.user.id;
    } else {
      filter.status = { $in: ['active', 'published', 'ACTIVE', 'PUBLISHED'] };
      // Public / Student visibility: Only jobs belonging to verified companies are publicly listed
      const verifiedCompanies = await Company.find(getVerifiedCompanyQuery()).select('_id');
      const verifiedCompanyIds = verifiedCompanies.map((c) => c._id);
      filter.companyId = { $in: verifiedCompanyIds };
    }

    if (req.query.location && typeof req.query.location === 'string') {
      const locRegex = createSafeSearchRegex(req.query.location);
      if (locRegex) {
        filter.location = locRegex;
      }
    }

    if (req.query.jobType && typeof req.query.jobType === 'string') {
      filter.jobType = req.query.jobType.trim();
    }

    if (req.query.skills && typeof req.query.skills === 'string') {
      const skillsList = req.query.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsList.length > 0) {
        const safeSkillRegexes = skillsList
          .map((s) => createSafeSearchRegex(s))
          .filter(Boolean);
        if (safeSkillRegexes.length > 0) {
          filter['requiredSkills.name'] = { $in: safeSkillRegexes };
        }
      }
    }

    if (req.query.search && typeof req.query.search === 'string') {
      const searchRegex = createSafeSearchRegex(req.query.search);
      if (searchRegex) {
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { location: searchRegex },
          { companyName: searchRegex },
          { 'requiredSkills.name': searchRegex },
        ];
      }
    }

    // Bounded Pagination & Safe Sorting
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 10, 50);
    const sortObj = parseSorting(req.query.sortBy, req.query.sortOrder, ['createdAt', 'deadline', 'title'], 'createdAt', -1);

    const total = await Job.countDocuments(filter);
    const rawJobs = await Job.find(filter)
      .populate('companyId', 'name website industry location logo verified')
      .populate('postedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Apply explicit response serialization
    const isOwnerOrAdmin = req.query.myJobs === 'true' && req.user && (req.user.role === 'RECRUITER' || req.user.role === 'UNIVERSITY_ADMIN');
    const jobs = rawJobs.map((j) =>
      serializeJob(j, {
        isOwner: isOwnerOrAdmin && j.postedBy && j.postedBy._id && j.postedBy._id.toString() === req.user.id,
        isAdmin: req.user && req.user.role === 'UNIVERSITY_ADMIN',
      })
    );

    return successResponse(res, 200, 'Jobs retrieved successfully', {
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('[jobController.getJobs]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/jobs/:id
 * Public — single job details (PII redacted for public viewers)
 */
const getJobById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid job ID format');
    }

    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name website industry location logo verified verificationStatus')
      .populate('postedBy', 'name email');

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    // Public Visibility Check: An unverified or revoked company's job must not be publicly accessible
    const isOwner = req.user && job.postedBy && job.postedBy._id && job.postedBy._id.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'UNIVERSITY_ADMIN';

    if (!isOwner && !isAdmin) {
      if (!isCompanyVerified(job.companyId)) {
        return errorResponse(
          res,
          403,
          'Forbidden',
          'This posting belongs to an unaccredited or unverified company and is not publicly accessible'
        );
      }
      if (!['active', 'published', 'ACTIVE', 'PUBLISHED'].includes(job.status)) {
        return errorResponse(
          res,
          403,
          'Forbidden',
          'This job posting is closed or not currently active'
        );
      }
    }

    const serialized = serializeJob(job, { isOwner, isAdmin });

    return successResponse(res, 200, 'Job retrieved successfully', { job: serialized });
  } catch (error) {
    console.error('[jobController.getJobById]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PUT /api/v1/jobs/:id
 * RECRUITER only — update a job they posted
 */
const updateJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid job ID format');
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only edit jobs you posted');
    }

    // Verify company ownership of the job
    let company = null;
    if (job.companyId) {
      company = await Company.findById(job.companyId);
      if (company && company.recruiterUserId && company.recruiterUserId.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Forbidden', 'You do not own the company associated with this job');
      }
    }

    const allowedUpdates = [
      'title',
      'description',
      'jobType',
      'location',
      'stipend',
      'requiredSkills',
      'preferredSkills',
      'minCGPA',
      'allowedBranches',
      'eligibleDegrees',
      'eligibleGraduationYears',
      'deadline',
      'status',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        if (key === 'status') {
          const norm = normalizeStatus(req.body[key]);
          if (['active', 'published'].includes(norm)) {
            if (!isCompanyVerified(company)) {
              return errorResponse(
                res,
                403,
                'Company Verification Required',
                'Your company is not verified by University Admin. Jobs cannot be activated or published until approved.'
              );
            }
          }
          updates[key] = norm;
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return successResponse(res, 200, 'Job updated successfully', { job: updatedJob });
  } catch (error) {
    console.error('[jobController.updateJob]', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, 'Validation Error', error.message, error.errors);
    }
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PATCH /api/v1/jobs/:id/status
 * RECRUITER only — change job status (DRAFT, PUBLISHED/ACTIVE, CLOSED)
 */
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 400, 'Validation Error', "status is required");
    }

    const normalized = normalizeStatus(status);
    if (!['active', 'closed', 'draft'].includes(normalized)) {
      return errorResponse(res, 400, 'Validation Error', "status must be one of: 'active', 'closed', 'draft', 'published'");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid job ID format');
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only change status of jobs you posted');
    }

    // Verify company ownership and verification status of the job
    if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterUserId && company.recruiterUserId.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Forbidden', 'You do not own the company associated with this job');
      }
      // If recruiter attempts to activate/publish job, require verified company
      if (['active', 'published'].includes(normalized)) {
        if (!isCompanyVerified(company)) {
          return errorResponse(
            res,
            403,
            'Company Verification Required',
            'Your company is not verified by University Admin. Jobs cannot be activated or published until approved.'
          );
        }
      }
    }

    job.status = normalized;
    await job.save();

    return successResponse(res, 200, 'Job status updated', { job });
  } catch (error) {
    console.error('[jobController.updateJobStatus]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * DELETE /api/v1/jobs/:id
 * RECRUITER only — soft delete (set status = 'closed')
 */
const deleteJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid job ID format');
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only delete jobs you posted');
    }

    // Verify company ownership of the job
    if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterUserId && company.recruiterUserId.toString() !== req.user.id) {
        return errorResponse(res, 403, 'Forbidden', 'You do not own the company associated with this job');
      }
    }

    job.status = 'closed';
    await job.save();

    return successResponse(res, 200, 'Job closed (soft deleted) successfully', { job });
  } catch (error) {
    console.error('[jobController.deleteJob]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/jobs/:id/match
 * STUDENT only — returns explainable match percentage between student profile and job
 */
const getJobMatch = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid job ID format');
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile || !profile.skills || profile.skills.length === 0 || profile.cgpa === undefined) {
      return successResponse(res, 200, 'Match analysis computed', {
        profileComplete: false,
        matchPercentage: null,
        message: 'Please complete your student profile (skills and CGPA) to view intelligent match analysis.',
      });
    }

    const studentSkills = profile.skills.map((s) => s.name);
    const jobSkills = (job.requiredSkills || []).map((s) => ({
      name: s.name,
      weight: s.weight || 20,
      minimum_level: s.minimumLevel || 'beginner',
    }));

    try {
      const matchResult = await AIClientService.matchJob(
        studentSkills,
        jobSkills,
        profile.cgpa,
        job.minCGPA || 6.0
      );

      return successResponse(res, 200, 'Match analysis computed successfully', {
        profileComplete: true,
        matchPercentage: matchResult.match_percentage,
        cgpaEligible: matchResult.cgpa_eligible,
        matchedSkills: matchResult.matched_skills,
        missingSkills: matchResult.missing_skills,
        breakdown: matchResult.breakdown,
        explanation: 'Deterministic weighted scoring: 90% required skills match weight + 10% CGPA eligibility check.',
        recommendation: matchResult.recommendation_summary,
      });
    } catch (aiErr) {
      console.warn('[jobController.getJobMatch] AI service unavailable, falling back to local calculation');
      // Fallback local explainable calculation
      const studentSkillSet = new Set(studentSkills.map((s) => s.toLowerCase()));
      const matched = [];
      const missing = [];
      let totalW = 0;
      let matchedW = 0;

      for (const reqSkill of job.requiredSkills || []) {
        const w = reqSkill.weight || 20;
        totalW += w;
        if (studentSkillSet.has(reqSkill.name.toLowerCase())) {
          matched.push(reqSkill.name);
          matchedW += w;
        } else {
          missing.push(reqSkill.name);
        }
      }

      const skillScore = totalW > 0 ? (matchedW / totalW) * 100 : 0;
      const cgpaEligible = profile.cgpa >= (job.minCGPA || 6.0);
      const matchScore = Math.round(skillScore * 0.9 + (cgpaEligible ? 10 : 0));

      return successResponse(res, 200, 'Match analysis computed (fallback)', {
        profileComplete: true,
        matchPercentage: matchScore,
        cgpaEligible,
        matchedSkills: matched,
        missingSkills: missing,
        breakdown: { skill_match_score: Math.round(skillScore), cgpa_score: cgpaEligible ? 100 : 0 },
        explanation: 'Deterministic weighted scoring: 90% required skills match weight + 10% CGPA eligibility check.',
        recommendation: `Matches ${matched.length} skill(s). Missing: ${missing.join(', ') || 'None'}.`,
      });
    }
  } catch (error) {
    console.error('[jobController.getJobMatch]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
  getJobMatch,
};

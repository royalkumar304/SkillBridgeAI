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

    // Resolve company reference
    let targetCompanyId = companyId;
    let resolvedCompanyName = companyName || 'SkillBridge Partner';

    if (!targetCompanyId || !mongoose.Types.ObjectId.isValid(targetCompanyId)) {
      // Find or auto-provision company for recruiter
      let company = await Company.findOne({ recruiterUserId: req.user.id });
      if (!company) {
        const uniqueName = companyName || `${req.user.name || 'Recruiter'} Enterprises`;
        try {
          company = await Company.create({
            name: uniqueName,
            industry: 'Technology',
            recruiterUserId: req.user.id,
            location: location || 'Remote',
          });
        } catch (compErr) {
          company = await Company.findOne({ recruiterUserId: req.user.id });
        }
      }
      if (company) {
        targetCompanyId = company._id;
        resolvedCompanyName = company.name;
      }
    }

    const job = await Job.create({
      title,
      description,
      companyId: targetCompanyId,
      companyName: resolvedCompanyName,
      jobType: jobType || 'internship',
      location: location || 'Remote',
      stipend: stipend ? String(stipend) : 'Unpaid / Performance Stipend',
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
 * Returns jobs with optional filters: ?skills=&location=&jobType=&search=&myJobs=true
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
    }

    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }

    if (req.query.jobType) {
      filter.jobType = req.query.jobType;
    }

    if (req.query.skills) {
      const skillsList = req.query.skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillsList.length > 0) {
        filter['requiredSkills.name'] = { $in: skillsList.map((s) => new RegExp(s, 'i')) };
      }
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { companyName: searchRegex },
        { 'requiredSkills.name': searchRegex },
      ];
    }

    const jobs = await Job.find(filter)
      .populate('companyId', 'name website industry location')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Jobs retrieved successfully', { jobs, total: jobs.length });
  } catch (error) {
    console.error('[jobController.getJobs]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/jobs/:id
 * Public — single job details
 */
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name website industry location')
      .populate('postedBy', 'name email');

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    return successResponse(res, 200, 'Job retrieved successfully', { job });
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
    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only edit jobs you posted');
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
          updates[key] = normalizeStatus(req.body[key]);
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

    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only change status of jobs you posted');
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
    const job = await Job.findById(req.params.id);

    if (!job) {
      return errorResponse(res, 404, 'Not Found', 'Job not found');
    }

    if (!job.postedBy || job.postedBy.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'You can only delete jobs you posted');
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

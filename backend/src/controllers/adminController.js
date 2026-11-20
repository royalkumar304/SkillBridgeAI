/**
 * Admin Controller (Day 5)
 * Provides real MongoDB-derived statistics, student directory, company verification,
 * and campus curriculum gap analytics for UNIVERSITY_ADMIN.
 */

const mongoose = require('mongoose');
const { User, StudentProfile, Job, Application, Company } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { normalizeSkillName } = require('../utils/skillTaxonomy');
const { calculateCareerReadinessAuthoritative } = require('../utils/readinessCalculator');
const {
  notifyCompanyVerified,
  notifyCompanyVerificationRevoked,
} = require('../services/notificationService');
const { createSafeSearchRegex, parsePagination } = require('../utils/querySanitizer');

/**
 * GET /api/v1/admin/stats
 * Real MongoDB-derived platform statistics.
 */
const getAdminStats = async (req, res) => {
  try {
    // 1. Total students count
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });

    // 2. Verified profiles (profiles with degree, branch, university, and >=1 skill)
    const verifiedProfiles = await StudentProfile.countDocuments({
      university: { $exists: true, $ne: '' },
      degree: { $exists: true, $ne: '' },
      'skills.0': { $exists: true }
    });

    // 3. Active corporate partners (companies with verified: true)
    const activePartners = await Company.countDocuments({ verified: true });
    const totalCompanies = await Company.countDocuments();

    // 4. Job opportunities
    const totalJobs = await Job.countDocuments({ status: { $in: ['active', 'published'] }, jobType: { $ne: 'internship' } });
    const totalInternships = await Job.countDocuments({ status: { $in: ['active', 'published'] }, jobType: 'internship' });

    // 5. Total applications
    const totalApplications = await Application.countDocuments();

    // 6. Placed students (unique students with 'selected' or 'shortlisted' applications)
    const selectedApps = await Application.find({ status: { $in: ['selected', 'placed'] } }).distinct('studentId');
    const placedStudents = selectedApps.length;

    // Transparent placement rate: placedStudents / totalStudents * 100
    const placementRate = totalStudents > 0 ? Number(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

    // 7. Average career readiness across all students with profiles
    const profiles = await StudentProfile.find({}, 'skills projects experience cgpa careerGoal');
    let avgReadiness = 0;
    if (profiles.length > 0) {
      let sum = 0;
      for (const p of profiles) {
        const readinessData = calculateCareerReadinessAuthoritative(p, p.careerGoal, 50);
        sum += readinessData.readinessScore;
      }
      avgReadiness = Number((sum / profiles.length).toFixed(1));
    }

    return successResponse(res, 200, 'Admin platform statistics calculated successfully', {
      totalStudents,
      verifiedProfiles,
      placementRate,
      activePartners,
      totalCompanies,
      totalApplications,
      averageReadinessScore: avgReadiness,
      totalJobs,
      totalInternships,
      placedStudents
    });
  } catch (error) {
    console.error('[adminController.getAdminStats]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/admin/students
 * Paginated, searchable, and filterable student directory without N+1 queries.
 */
const getAdminStudents = async (req, res) => {
  try {
    const { search, branch, minCGPA, maxCGPA, page = 1, limit = 20 } = req.query;

    const { page: pageNum, limit: limitNum, skip } = parsePagination(page, limit, 20, 50);

    // Build StudentProfile query filters
    const profileFilter = {};
    if (branch && typeof branch === 'string' && branch.trim()) {
      const bRegex = createSafeSearchRegex(branch.trim());
      if (bRegex) profileFilter.branch = bRegex;
    }
    if (minCGPA || maxCGPA) {
      profileFilter.cgpa = {};
      if (minCGPA && !isNaN(parseFloat(minCGPA))) profileFilter.cgpa.$gte = parseFloat(minCGPA);
      if (maxCGPA && !isNaN(parseFloat(maxCGPA))) profileFilter.cgpa.$lte = parseFloat(maxCGPA);
      if (Object.keys(profileFilter.cgpa).length === 0) delete profileFilter.cgpa;
    }

    // Build user match filter if search term provided
    let userFilter = { role: 'STUDENT' };
    if (search && typeof search === 'string' && search.trim()) {
      const sRegex = createSafeSearchRegex(search.trim());
      if (sRegex) {
        userFilter.$or = [
          { name: sRegex },
          { email: sRegex }
        ];
      }
    }

    // Find eligible student user IDs first
    const studentUsers = await User.find(userFilter, '_id name email createdAt').lean();
    const studentUserIds = studentUsers.map((u) => u._id);

    profileFilter.userId = { $in: studentUserIds };

    // Total count of matching profiles
    const totalCount = await StudentProfile.countDocuments(profileFilter);

    // Fetch page of profiles
    const profiles = await StudentProfile.find(profileFilter)
      .populate('userId', 'name email createdAt isVerified')
      .skip(skip)
      .limit(limitNum)
      .lean();

    const profileUserIds = profiles.map((p) => p.userId?._id).filter(Boolean);

    // Aggregate application counts per student to avoid N+1 queries
    const appCounts = await Application.aggregate([
      { $match: { studentId: { $in: profileUserIds } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } }
    ]);

    const appCountMap = new Map();
    appCounts.forEach((a) => appCountMap.set(a._id.toString(), a.count));

    // Format student items
    const students = profiles.map((p) => {
      const u = p.userId || {};
      const skillsCount = (p.skills || []).length;
      const cgpa = typeof p.cgpa === 'number' ? p.cgpa : 0;

      // Authoritative unified readiness calculation
      const readinessData = calculateCareerReadinessAuthoritative(p, p.careerGoal, 50);
      const readinessScore = readinessData.readinessScore;

      return {
        id: u._id,
        profileId: p._id,
        name: u.name || 'Anonymous Student',
        email: u.email || 'N/A',
        university: p.university || 'N/A',
        degree: p.degree || 'B.Tech',
        branch: p.branch || 'General',
        graduationYear: p.graduationYear || null,
        cgpa,
        skillsCount,
        applicationCount: appCountMap.get(u._id?.toString()) || 0,
        readinessScore,
        registeredAt: u.createdAt
      };
    });

    return successResponse(res, 200, 'Student directory retrieved successfully', {
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('[adminController.getAdminStudents]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/admin/companies
 * Return list of recruiter companies with active job counts.
 */
const getAdminCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('recruiterUserId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const companyIds = companies.map((c) => c._id);

    // Aggregate active jobs count per company
    const jobCounts = await Job.aggregate([
      { $match: { companyId: { $in: companyIds }, status: { $in: ['active', 'published'] } } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } }
    ]);

    const jobCountMap = new Map();
    jobCounts.forEach((j) => jobCountMap.set(j._id.toString(), j.count));

    const result = companies.map((c) => ({
      id: c._id,
      name: c.name,
      website: c.website || '',
      industry: c.industry || 'Technology',
      location: c.location || 'Remote',
      verified: Boolean(c.verified),
      createdAt: c.createdAt,
      recruiter: {
        id: c.recruiterUserId?._id,
        name: c.recruiterUserId?.name || 'Recruiter',
        email: c.recruiterUserId?.email || 'N/A'
      },
      activeJobsCount: jobCountMap.get(c._id.toString()) || 0
    }));

    return successResponse(res, 200, 'Company list retrieved successfully', {
      companies: result,
      total: result.length
    });
  } catch (error) {
    console.error('[adminController.getAdminCompanies]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PATCH /api/v1/admin/companies/:id/verify
 * Approves or revokes company verification.
 */
const verifyCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid company ID format');
    }

    if (verified === undefined && status === undefined) {
      return errorResponse(res, 400, 'Validation Error', 'Field "verified" (boolean) or "status" (APPROVED, REJECTED, REVOKED) is required');
    }

    if (verified !== undefined && typeof verified !== 'boolean') {
      return errorResponse(res, 400, 'Validation Error', 'Field "verified" must be a boolean');
    }

    let isApproved = verified;
    let newStatus = companyVerificationStatus(status, verified);

    function companyVerificationStatus(explicitStatus, boolVerified) {
      if (explicitStatus) {
        const upper = explicitStatus.toUpperCase();
        if (['APPROVED', 'REJECTED', 'REVOKED', 'PENDING'].includes(upper)) {
          return upper;
        }
      }
      return boolVerified ? 'APPROVED' : 'REVOKED';
    }

    if (isApproved === undefined) {
      isApproved = newStatus === 'APPROVED';
    }

    const company = await Company.findById(id);
    if (!company) {
      return errorResponse(res, 404, 'Not Found', 'Company not found');
    }

    const previousVerified = company.verified;
    company.verified = isApproved;
    company.verificationStatus = newStatus;
    if (isApproved) {
      company.verifiedAt = new Date();
      company.approvedBy = req.user.id;
    } else {
      company.approvedBy = req.user.id;
    }
    await company.save();

    // Trigger notification to the recruiter if verification status transitioned
    if (previousVerified !== isApproved) {
      if (isApproved) {
        await notifyCompanyVerified({ company, adminUser: req.user });
      } else {
        await notifyCompanyVerificationRevoked({ company, adminUser: req.user });
      }
    }

    return successResponse(res, 200, `Company verification status updated to ${isApproved}`, {
      company: {
        id: company._id,
        name: company.name,
        verified: company.verified,
        verificationStatus: company.verificationStatus,
        verifiedAt: company.verifiedAt,
        updatedAt: company.updatedAt
      }
    });
  } catch (error) {
    console.error('[adminController.verifyCompany]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/admin/curriculum-gap
 * Real campus-wide skill demand vs supply analysis.
 */
const getCurriculumGap = async (req, res) => {
  try {
    // 1. Fetch active jobs to compute industry demand
    const activeJobs = await Job.find({ status: { $in: ['active', 'published'] } }, 'requiredSkills');
    const totalJobs = activeJobs.length;

    // 2. Fetch all student profiles to compute campus supply
    const profiles = await StudentProfile.find({}, 'skills');
    const totalStudents = profiles.length;

    if (totalJobs === 0 && totalStudents === 0) {
      return successResponse(res, 200, 'No active jobs or student profiles found for curriculum gap calculation', {
        gaps: [],
        curriculumRecommendations: [
          'Encourage recruiters to publish active job postings to generate campus demand analytics.',
          'Instruct students to populate their technical profiles or upload resumes.'
        ],
        metrics: { totalJobs: 0, totalStudents: 0 }
      });
    }

    // Aggregate Skill Demand (how many active jobs require skill X)
    const demandCount = {};
    activeJobs.forEach((job) => {
      const seenInJob = new Set();
      (job.requiredSkills || []).forEach((reqSkill) => {
        const canonical = normalizeSkillName(reqSkill.name);
        if (canonical && !seenInJob.has(canonical)) {
          seenInJob.add(canonical);
          demandCount[canonical] = (demandCount[canonical] || 0) + 1;
        }
      });
    });

    // Aggregate Campus Supply (how many students possess skill X)
    const supplyCount = {};
    profiles.forEach((p) => {
      const seenInProfile = new Set();
      (p.skills || []).forEach((s) => {
        const canonical = normalizeSkillName(s.name);
        if (canonical && !seenInProfile.has(canonical)) {
          seenInProfile.add(canonical);
          supplyCount[canonical] = (supplyCount[canonical] || 0) + 1;
        }
      });
    });

    // Union of all demanded skills
    const gaps = [];
    const allDemandedSkills = Object.keys(demandCount);

    allDemandedSkills.forEach((skill) => {
      const jobsCount = demandCount[skill] || 0;
      const recruiterDemand = totalJobs > 0 ? Math.round((jobsCount / totalJobs) * 100) : 0;

      const studentsCount = supplyCount[skill] || 0;
      const campusProficiency = totalStudents > 0 ? Math.round((studentsCount / totalStudents) * 100) : 0;

      const gapPercentage = recruiterDemand - campusProficiency;

      gaps.push({
        skill,
        recruiterDemand,
        campusProficiency,
        gapPercentage,
        jobsRequiring: jobsCount,
        studentsPossessing: studentsCount
      });
    });

    // Sort by highest gap first
    gaps.sort((a, b) => b.gapPercentage - a.gapPercentage);
    const topGaps = gaps.slice(0, 10);

    // Formulate actionable curriculum recommendations based on actual positive gaps
    const curriculumRecommendations = [];
    topGaps.filter((g) => g.gapPercentage > 15).forEach((g) => {
      curriculumRecommendations.push(
        `High Industry Deficit: ${g.skill} is required by ${g.recruiterDemand}% of corporate postings, but held by only ${g.campusProficiency}% of students. Recommend integrating hands-on ${g.skill} coursework or workshops.`
      );
    });

    if (curriculumRecommendations.length === 0) {
      curriculumRecommendations.push('Campus skill availability aligns well with current industry recruiter requirements.');
    }

    return successResponse(res, 200, 'Campus curriculum gap analysis computed successfully', {
      gaps: topGaps,
      curriculumRecommendations,
      metrics: {
        totalJobs,
        totalStudents,
        totalUniqueDemandedSkills: allDemandedSkills.length
      }
    });
  } catch (error) {
    console.error('[adminController.getCurriculumGap]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/admin/industry-skill-demand
 * Calculate actual skill demand from active jobs & internships and compare with campus supply.
 * Returns sorted top 10 skills by highest demand-supply gap.
 */
const getIndustrySkillDemand = async (req, res) => {
  try {
    const activeJobs = await Job.find({
      status: { $in: ['active', 'published', 'ACTIVE', 'PUBLISHED'] }
    }).lean();
    const totalOpportunities = activeJobs.length;

    const profiles = await StudentProfile.find({}, 'skills').lean();
    const totalStudents = profiles.length;

    if (totalOpportunities === 0 && totalStudents === 0) {
      return successResponse(res, 200, 'Industry skill demand computed successfully', {
        skills: [],
        totalOpportunities: 0,
        totalStudents: 0
      });
    }

    // Map demand counts
    const demandCount = {};
    activeJobs.forEach((job) => {
      const seen = new Set();
      (job.requiredSkills || []).forEach((reqSkill) => {
        const canonical = normalizeSkillName(reqSkill.name);
        if (canonical && !seen.has(canonical)) {
          seen.add(canonical);
          demandCount[canonical] = (demandCount[canonical] || 0) + 1;
        }
      });
    });

    // Map supply counts
    const supplyCount = {};
    profiles.forEach((p) => {
      const seen = new Set();
      (p.skills || []).forEach((s) => {
        const canonical = normalizeSkillName(s.name);
        if (canonical && !seen.has(canonical)) {
          seen.add(canonical);
          supplyCount[canonical] = (supplyCount[canonical] || 0) + 1;
        }
      });
    });

    const skills = Object.keys(demandCount).map((skill) => {
      const opportunityCount = demandCount[skill] || 0;
      const industryDemand = totalOpportunities > 0 ? Math.round((opportunityCount / totalOpportunities) * 100) : 0;
      const studentCount = supplyCount[skill] || 0;
      const campusAvailability = totalStudents > 0 ? Math.round((studentCount / totalStudents) * 100) : 0;
      const gap = industryDemand - campusAvailability;

      return {
        skill,
        opportunityCount,
        industryDemand,
        studentCount,
        campusAvailability,
        gap
      };
    });

    // Sort by highest demand-supply gap, take top 10
    skills.sort((a, b) => b.gap - a.gap);
    const topSkills = skills.slice(0, 10);

    return successResponse(res, 200, 'Industry skill demand retrieved successfully', {
      skills: topSkills,
      totalOpportunities,
      totalStudents
    });
  } catch (error) {
    console.error('[adminController.getIndustrySkillDemand]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/admin/industry-partners
 * Returns comprehensive industry partners list with active jobs, internships, total applicants, and selected counts.
 */
const getIndustryPartners = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('recruiterUserId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const companyIds = companies.map((c) => c._id);

    // Fetch all jobs for these companies
    const jobs = await Job.find({ companyId: { $in: companyIds } }).lean();
    const jobIds = jobs.map((j) => j._id);

    // Fetch applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } }).lean();

    // Map stats per company
    const partners = companies.map((comp) => {
      const compJobs = jobs.filter((j) => String(j.companyId) === String(comp._id));
      const activeJobs = compJobs.filter((j) => ['active', 'published'].includes(j.status?.toLowerCase()) && j.jobType !== 'internship').length;
      const activeInternships = compJobs.filter((j) => ['active', 'published'].includes(j.status?.toLowerCase()) && j.jobType === 'internship').length;

      const compJobIds = new Set(compJobs.map((j) => String(j._id)));
      const compApps = applications.filter((a) => compJobIds.has(String(a.jobId)));
      const totalApplicants = compApps.length;
      const selectedCandidates = compApps.filter((a) => a.status === 'selected').length;

      return {
        id: comp._id,
        name: comp.name,
        industry: comp.industry || 'Technology',
        location: comp.location || 'Remote',
        website: comp.website || '',
        verified: Boolean(comp.verified),
        createdAt: comp.createdAt,
        recruiter: {
          id: comp.recruiterUserId?._id,
          name: comp.recruiterUserId?.name || 'Recruiter',
          email: comp.recruiterUserId?.email || 'N/A'
        },
        activeJobs,
        activeInternships,
        totalApplicants,
        selectedCandidates
      };
    });

    return successResponse(res, 200, 'Industry partners retrieved successfully', {
      partners,
      total: partners.length
    });
  } catch (error) {
    console.error('[adminController.getIndustryPartners]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/admin/internships
 * Returns all internships across all companies with applicant counts, company details, and filters.
 */
const getAdminInternships = async (req, res) => {
  try {
    const { companyId, search } = req.query;
    const filter = { jobType: 'internship' };

    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      filter.companyId = companyId;
    }

    if (search && typeof search === 'string') {
      const regex = createSafeSearchRegex(search);
      if (regex) {
        filter.$or = [{ title: regex }, { companyName: regex }, { location: regex }];
      }
    }

    const internships = await Job.find(filter)
      .populate('companyId', 'name industry verified location website')
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const internshipIds = internships.map((i) => i._id);

    // Aggregate applications for each internship
    const appStats = await Application.aggregate([
      { $match: { jobId: { $in: internshipIds } } },
      {
        $group: {
          _id: '$jobId',
          totalApplicants: { $sum: 1 },
          selectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = new Map();
    appStats.forEach((s) => statsMap.set(String(s._id), s));

    const result = internships.map((item) => {
      const stats = statsMap.get(String(item._id)) || { totalApplicants: 0, selectedCount: 0 };
      return {
        ...item,
        id: item._id,
        totalApplicants: stats.totalApplicants,
        selectedCount: stats.selectedCount
      };
    });

    return successResponse(res, 200, 'Admin internships retrieved successfully', {
      internships: result,
      total: result.length
    });
  } catch (error) {
    console.error('[adminController.getAdminInternships]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getAdminStats,
  getAdminStudents,
  getAdminCompanies,
  verifyCompany,
  getCurriculumGap,
  getIndustrySkillDemand,
  getIndustryPartners,
  getAdminInternships
};

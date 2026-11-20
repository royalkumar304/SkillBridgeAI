/**
 * Student Profile Controller
 * Handles profile retrieval, update, and completion score with strict field allowlisting,
 * validation, and protection of server-controlled fields against mass assignment.
 */

const StudentProfile = require('../models/StudentProfile');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { normalizeSkillName, compareLevels } = require('../utils/skillTaxonomy');

// Fields used to compute profile completion
const COMPLETION_FIELDS = [
  'university',
  'degree',
  'branch',
  'graduationYear',
  'cgpa',
  'skills',
  'projects',
  'githubUrl',
  'linkedinUrl',
  'careerGoal',
];

// Explicit allowlist of fields a student is permitted to self-manage
const ALLOWED_STUDENT_UPDATE_FIELDS = new Set([
  'bio',
  'phone',
  'university',
  'degree',
  'branch',
  'graduationYear',
  'cgpa',
  'careerGoal',
  'skills',
  'projects',
  'certifications',
  'experience',
  'githubUrl',
  'linkedinUrl',
]);

// Server-controlled and system-protected fields that must NEVER be modified via self-service PUT
const SERVER_CONTROLLED_FIELDS = new Set([
  'userId',
  '_id',
  '__v',
  'role',
  'verified',
  'verifiedAt',
  'approvedBy',
  'createdBy',
  'updatedBy',
  'resumeId',
  'resumeUrl',
  'readinessScore',
  'status',
  'accountStatus',
  'createdAt',
  'updatedAt',
]);

/**
 * Validates and sanitizes a URL string. Returns true if valid or empty, false if invalid.
 */
const isValidHttpUrl = (str) => {
  if (!str || typeof str !== 'string' || str.trim() === '') return true;
  try {
    const url = new URL(str.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Validates and cleans student self-service update payload.
 * Throws an object with { field, message } on validation error.
 */
const validateAndFilterProfilePayload = (body, existingSkills = []) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw { field: 'body', message: 'Request body must be a valid JSON object' };
  }

  // Prevent prototype pollution or operator injection attempts
  for (const key of Object.keys(body)) {
    if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw { field: key, message: `Disallowed or malicious property name: "${key}"` };
    }
  }

  const sanitized = {};

  // Map of existing skills to preserve trusted source (e.g., resume_extracted, assessment_verified)
  const existingSkillMap = new Map();
  if (Array.isArray(existingSkills)) {
    existingSkills.forEach((s) => {
      if (s && s.name) {
        existingSkillMap.set(s.name.trim().toLowerCase(), s);
      }
    });
  }

  // Iterate over only allowed student fields
  for (const field of ALLOWED_STUDENT_UPDATE_FIELDS) {
    if (body[field] === undefined) continue;
    const value = body[field];

    switch (field) {
      case 'bio':
      case 'university':
      case 'degree':
      case 'branch':
      case 'careerGoal': {
        if (typeof value !== 'string') {
          throw { field, message: `Field "${field}" must be a string` };
        }
        if (value.length > 500) {
          throw { field, message: `Field "${field}" exceeds maximum length of 500 characters` };
        }
        sanitized[field] = value.trim();
        break;
      }

      case 'phone': {
        if (typeof value !== 'string') {
          throw { field, message: 'Phone must be a string' };
        }
        if (value.length > 30) {
          throw { field, message: 'Phone exceeds maximum length of 30 characters' };
        }
        sanitized[field] = value.trim();
        break;
      }

      case 'graduationYear': {
        const year = Number(value);
        if (isNaN(year) || !Number.isInteger(year) || year < 2000 || year > 2040) {
          throw { field, message: 'Graduation year must be an integer between 2000 and 2040' };
        }
        sanitized[field] = year;
        break;
      }

      case 'cgpa': {
        const score = Number(value);
        if (isNaN(score) || score < 0 || score > 10) {
          throw { field, message: 'CGPA must be a number between 0.0 and 10.0' };
        }
        sanitized[field] = Math.round(score * 100) / 100;
        break;
      }

      case 'githubUrl':
      case 'linkedinUrl': {
        if (typeof value !== 'string') {
          throw { field, message: `Field "${field}" must be a string` };
        }
        if (value.trim() !== '' && !isValidHttpUrl(value)) {
          throw { field, message: `Field "${field}" must be a valid HTTP/HTTPS URL` };
        }
        sanitized[field] = value.trim();
        break;
      }

      case 'skills': {
        if (!Array.isArray(value)) {
          throw { field: 'skills', message: 'Skills must be an array of skill objects' };
        }
        if (value.length > 100) {
          throw { field: 'skills', message: 'Maximum 100 skills allowed' };
        }

        const validSkills = [];
        const seenSkillNames = new Set();

        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (!item || typeof item !== 'object') {
            throw { field: `skills[${i}]`, message: 'Each skill entry must be an object' };
          }
          const rawName = typeof item.name === 'string' ? item.name.trim() : '';
          if (!rawName) {
            throw { field: `skills[${i}].name`, message: 'Skill name is required' };
          }
          if (rawName.length > 100) {
            throw { field: `skills[${i}].name`, message: 'Skill name exceeds 100 characters' };
          }

          const canonical = normalizeSkillName(rawName);
          const lookupKey = canonical.toLowerCase();
          if (seenSkillNames.has(lookupKey)) continue; // Deduplicate
          seenSkillNames.add(lookupKey);

          const requestedLevel = typeof item.level === 'string' ? item.level.toLowerCase().trim() : 'beginner';
          if (!['beginner', 'intermediate', 'advanced'].includes(requestedLevel)) {
            throw { field: `skills[${i}].level`, message: 'Skill level must be beginner, intermediate, or advanced' };
          }

          // SERVER-CONTROLLED PROVENANCE PROTECTION:
          // A student cannot grant themselves 'assessment_verified' or forge 'resume_extracted'
          // via self-service PUT.
          // Explicit Provenance Policy:
          // 1. Unchanged trusted skill (same canonical name AND same level): preserve authentic provenance.
          // 2. Modified level on a verified/extracted skill: unverified change downgrades source to 'self_reported'
          //    (requires official re-assessment or resume re-sync to verify the new claim).
          // 3. New skill or changed skill name: source is strictly 'self_reported' with no verifiedAt timestamp.
          let finalSource = 'self_reported';
          let finalVerifiedAt = undefined;

          if (existingSkillMap.has(lookupKey)) {
            const existing = existingSkillMap.get(lookupKey);
            const existingLevel = (existing.level || 'beginner').toLowerCase();

            // Provenance is preserved ONLY if the skill level remains genuinely unchanged
            if (
              (existing.source === 'assessment_verified' || existing.source === 'resume_extracted') &&
              existingLevel === requestedLevel
            ) {
              finalSource = existing.source;
              finalVerifiedAt = existing.verifiedAt;
            }
          }

          validSkills.push({
            name: canonical,
            level: requestedLevel,
            source: finalSource,
            ...(finalVerifiedAt ? { verifiedAt: finalVerifiedAt } : {}),
          });
        }

        sanitized.skills = validSkills;
        break;
      }

      case 'projects': {
        if (!Array.isArray(value)) {
          throw { field: 'projects', message: 'Projects must be an array' };
        }
        if (value.length > 30) {
          throw { field: 'projects', message: 'Maximum 30 projects allowed' };
        }

        sanitized.projects = value.map((p, idx) => {
          if (!p || typeof p !== 'object') {
            throw { field: `projects[${idx}]`, message: 'Project item must be an object' };
          }
          const title = typeof p.title === 'string' ? p.title.trim() : '';
          if (!title) {
            throw { field: `projects[${idx}].title`, message: 'Project title is required' };
          }
          if (p.githubUrl && !isValidHttpUrl(p.githubUrl)) {
            throw { field: `projects[${idx}].githubUrl`, message: 'Project githubUrl must be a valid URL' };
          }
          if (p.liveUrl && !isValidHttpUrl(p.liveUrl)) {
            throw { field: `projects[${idx}].liveUrl`, message: 'Project liveUrl must be a valid URL' };
          }

          let techStack = [];
          if (Array.isArray(p.techStack)) {
            techStack = p.techStack.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
          }

          return {
            title,
            description: typeof p.description === 'string' ? p.description.trim() : '',
            techStack,
            githubUrl: typeof p.githubUrl === 'string' ? p.githubUrl.trim() : '',
            liveUrl: typeof p.liveUrl === 'string' ? p.liveUrl.trim() : '',
          };
        });
        break;
      }

      case 'certifications': {
        if (!Array.isArray(value)) {
          throw { field: 'certifications', message: 'Certifications must be an array' };
        }
        if (value.length > 30) {
          throw { field: 'certifications', message: 'Maximum 30 certifications allowed' };
        }

        sanitized.certifications = value.map((c, idx) => {
          if (!c || typeof c !== 'object') {
            throw { field: `certifications[${idx}]`, message: 'Certification item must be an object' };
          }
          const title = typeof c.title === 'string' ? c.title.trim() : '';
          const issuer = typeof c.issuer === 'string' ? c.issuer.trim() : '';
          if (!title || !issuer) {
            throw { field: `certifications[${idx}]`, message: 'Certification title and issuer are required' };
          }
          if (c.credentialUrl && !isValidHttpUrl(c.credentialUrl)) {
            throw { field: `certifications[${idx}].credentialUrl`, message: 'Credential URL must be a valid URL' };
          }

          let issueDate = undefined;
          if (c.issueDate) {
            const parsed = new Date(c.issueDate);
            if (!isNaN(parsed.getTime())) issueDate = parsed;
          }

          return {
            title,
            issuer,
            issueDate,
            credentialUrl: typeof c.credentialUrl === 'string' ? c.credentialUrl.trim() : '',
          };
        });
        break;
      }

      case 'experience': {
        if (!Array.isArray(value)) {
          throw { field: 'experience', message: 'Experience must be an array' };
        }
        if (value.length > 30) {
          throw { field: 'experience', message: 'Maximum 30 experience entries allowed' };
        }

        sanitized.experience = value.map((e, idx) => {
          if (!e || typeof e !== 'object') {
            throw { field: `experience[${idx}]`, message: 'Experience item must be an object' };
          }
          const title = typeof e.title === 'string' ? e.title.trim() : '';
          const company = typeof e.company === 'string' ? e.company.trim() : '';
          if (!title || !company) {
            throw { field: `experience[${idx}]`, message: 'Experience title and company are required' };
          }

          return {
            title,
            company,
            duration: typeof e.duration === 'string' ? e.duration.trim() : '',
            description: typeof e.description === 'string' ? e.description.trim() : '',
          };
        });
        break;
      }
    }
  }

  return sanitized;
};

/**
 * GET /api/v1/students/profile
 * - STUDENT: returns own profile
 * - UNIVERSITY_ADMIN: can pass ?userId=X to view student's profile
 */
const getProfile = async (req, res) => {
  try {
    let targetUserId = req.user.id;

    if (req.user.role === 'UNIVERSITY_ADMIN' && req.query.userId) {
      targetUserId = req.query.userId;
    } else if (req.user.role !== 'STUDENT' && !req.query.userId) {
      return errorResponse(res, 400, 'Bad Request', 'User ID is required for non-student requests');
    }

    const profile = await StudentProfile.findOne({ userId: targetUserId }).populate('userId', 'name email role');

    if (!profile) {
      return errorResponse(res, 404, 'Not Found', 'Student profile not found');
    }

    return successResponse(res, 200, 'Profile retrieved successfully', { profile });
  } catch (error) {
    console.error('[studentController.getProfile]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PUT /api/v1/students/profile
 * STUDENT only — creates or updates own profile (upsert)
 * Validates ownership, filters through strict allowlist, and protects server-controlled fields.
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch existing profile to preserve server-controlled fields (e.g. resumeId, verified skills)
    let profile = await StudentProfile.findOne({ userId });

    let sanitizedData;
    try {
      sanitizedData = validateAndFilterProfilePayload(req.body, profile ? profile.skills : []);
    } catch (valErr) {
      return errorResponse(res, 400, 'Validation Error', valErr.message, { field: valErr.field });
    }

    if (!profile) {
      // Create new profile with explicit fields only
      profile = new StudentProfile({
        userId,
        ...sanitizedData,
      });
    } else {
      // Update only sanitized allowlisted properties onto the existing document
      Object.keys(sanitizedData).forEach((key) => {
        profile[key] = sanitizedData[key];
      });
    }

    await profile.save();
    await profile.populate('userId', 'name email role');

    return successResponse(res, 200, 'Profile updated successfully', { profile });
  } catch (error) {
    console.error('[studentController.updateProfile]', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, 'Validation Error', error.message, error.errors);
    }
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/students/profile/completion
 * STUDENT only — returns { completionPercent, missingFields[] }
 */
const getProfileCompletion = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return successResponse(res, 200, 'Profile completion computed', {
        completionPercent: 0,
        missingFields: COMPLETION_FIELDS,
      });
    }

    const missingFields = [];

    for (const field of COMPLETION_FIELDS) {
      const value = profile[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      } else if (Array.isArray(value) && value.length === 0) {
        missingFields.push(field);
      }
    }

    const completedCount = COMPLETION_FIELDS.length - missingFields.length;
    const completionPercent = Math.round((completedCount / COMPLETION_FIELDS.length) * 100);

    return successResponse(res, 200, 'Profile completion computed', {
      completionPercent,
      missingFields,
    });
  } catch (error) {
    console.error('[studentController.getProfileCompletion]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * POST /api/v1/students/profile/sync-resume-skills
 * STUDENT only — merge extracted skills from resume into profile without duplicates,
 * preserving higher existing skill levels, and setting source to 'resume_extracted'.
 */
const syncResumeSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return errorResponse(res, 400, 'Validation Error', 'Field "skills" must be an array of skill names or objects');
    }

    if (skills.length === 0) {
      return errorResponse(res, 400, 'Validation Error', 'At least one skill is required to sync');
    }

    if (skills.length > 100) {
      return errorResponse(res, 400, 'Validation Error', 'Maximum 100 skills can be synchronized at once');
    }

    // Find or create student profile
    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new StudentProfile({
        userId: req.user.id,
        skills: [],
      });
    }

    const currentSkills = profile.skills || [];
    const skillMap = new Map();

    // Index existing skills by lowercase canonical name
    currentSkills.forEach((s) => {
      const canonical = normalizeSkillName(s.name);
      skillMap.set(canonical.toLowerCase(), {
        name: canonical,
        level: s.level || 'beginner',
        source: s.source || 'self_reported',
        verifiedAt: s.verifiedAt,
      });
    });

    let addedCount = 0;
    let updatedCount = 0;

    // Process incoming skills
    skills.forEach((item) => {
      let rawName = typeof item === 'string' ? item : item.name;
      let requestedLevel = typeof item === 'object' && item.level ? item.level.toLowerCase() : 'intermediate';

      if (!['beginner', 'intermediate', 'advanced'].includes(requestedLevel)) {
        requestedLevel = 'intermediate';
      }

      const canonical = normalizeSkillName(rawName);
      if (!canonical) return;

      const key = canonical.toLowerCase();
      if (skillMap.has(key)) {
        // Skill already exists: only upgrade level if new level is strictly higher
        const existing = skillMap.get(key);
        if (compareLevels(requestedLevel, existing.level) > 0) {
          existing.level = requestedLevel;
          updatedCount++;
        }
      } else {
        // New skill to be added with resume_extracted provenance
        skillMap.set(key, {
          name: canonical,
          level: requestedLevel,
          source: 'resume_extracted',
        });
        addedCount++;
      }
    });

    profile.skills = Array.from(skillMap.values());
    await profile.save();

    return successResponse(res, 200, 'Resume skills synchronized with profile successfully', {
      totalSkills: profile.skills.length,
      addedCount,
      updatedCount,
      skills: profile.skills,
    });
  } catch (error) {
    console.error('[studentController.syncResumeSkills]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProfileCompletion,
  syncResumeSkills,
  ALLOWED_STUDENT_UPDATE_FIELDS: Array.from(ALLOWED_STUDENT_UPDATE_FIELDS),
  SERVER_CONTROLLED_FIELDS: Array.from(SERVER_CONTROLLED_FIELDS),
  validateAndFilterProfilePayload,
};

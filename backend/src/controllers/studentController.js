/**
 * Student Profile Controller
 * Handles profile retrieval, update, and completion score.
 */

const StudentProfile = require('../models/StudentProfile');
const { successResponse, errorResponse } = require('../utils/responseHelper');

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
      // Recruiter or Admin without specific student
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
 * Validates that student cannot modify another student's profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Disallow overriding userId via request body
    const { userId: _, ...bodyData } = req.body;
    const updateData = { ...bodyData, userId };

    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email role');

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

module.exports = {
  getProfile,
  updateProfile,
  getProfileCompletion,
};

/**
 * Student Profile Routes
 */

const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, getProfileCompletion } = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// GET  /api/v1/students/profile/completion — must be before /:id-style routes
router.get(
  '/profile/completion',
  authenticateToken,
  requireRole('STUDENT'),
  getProfileCompletion
);

// GET  /api/v1/students/profile — STUDENT or UNIVERSITY_ADMIN (admin can pass ?userId=X)
router.get(
  '/profile',
  authenticateToken,
  requireRole('STUDENT', 'UNIVERSITY_ADMIN'),
  getProfile
);

// PUT  /api/v1/students/profile — STUDENT only
router.put(
  '/profile',
  authenticateToken,
  requireRole('STUDENT'),
  updateProfile
);

module.exports = router;

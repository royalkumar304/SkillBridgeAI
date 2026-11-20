/**
 * Student Profile & Resume Routes
 */

const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, getProfileCompletion, syncResumeSkills } = require('../controllers/studentController');
const { uploadResume, getMyResumes, downloadResume, deleteResume } = require('../controllers/resumeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

// ── Resume Management Endpoints ──────────────────────────────────────────

// POST /api/v1/students/resume — Upload PDF resume (STUDENT only)
router.post(
  '/resume',
  uploadLimiter,
  authenticateToken,
  requireRole('STUDENT'),
  uploadResume
);

// GET  /api/v1/students/resume — View own uploaded resumes (STUDENT only)
router.get(
  '/resume',
  authenticateToken,
  requireRole('STUDENT'),
  getMyResumes
);

// GET  /api/v1/students/resume/:resumeId/download — Secure resume download
// Accessible by owner (STUDENT), authorized RECRUITER (applied to job), or UNIVERSITY_ADMIN
router.get(
  '/resume/:resumeId/download',
  authenticateToken,
  downloadResume
);

// DELETE /api/v1/students/resume/:resumeId — Delete own resume (STUDENT only)
router.delete(
  '/resume/:resumeId',
  authenticateToken,
  requireRole('STUDENT'),
  deleteResume
);

// ── Profile & Skill Endpoints ────────────────────────────────────────────

// POST /api/v1/students/profile/sync-resume-skills — STUDENT only
router.post(
  '/profile/sync-resume-skills',
  authenticateToken,
  requireRole('STUDENT'),
  syncResumeSkills
);

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

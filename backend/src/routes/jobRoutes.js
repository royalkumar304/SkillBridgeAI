/**
 * Job Routes
 */

const express = require('express');
const router = express.Router();

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
  getJobMatch,
} = require('../controllers/jobController');

const { getJobApplications } = require('../controllers/applicationController');

const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { publicApiLimiter, searchLimiter } = require('../middleware/rateLimiter');

// POST   /api/v1/jobs — RECRUITER only
router.post('/', authenticateToken, requireRole('RECRUITER'), createJob);

// GET    /api/v1/jobs — public (supports ?myJobs=true with optional recruiter token)
router.get('/', publicApiLimiter, optionalAuth, getJobs);

// GET    /api/v1/jobs/:id — public / optionalAuth (enforces company verification for public visitors)
router.get('/:id', publicApiLimiter, optionalAuth, getJobById);

// GET    /api/v1/jobs/:id/match — STUDENT only
router.get('/:id/match', authenticateToken, requireRole('STUDENT'), getJobMatch);

// PUT    /api/v1/jobs/:id — RECRUITER only
router.put('/:id', authenticateToken, requireRole('RECRUITER'), updateJob);

// PATCH  /api/v1/jobs/:id/status — RECRUITER only
router.patch('/:id/status', authenticateToken, requireRole('RECRUITER'), updateJobStatus);

// DELETE /api/v1/jobs/:id — RECRUITER only
router.delete('/:id', authenticateToken, requireRole('RECRUITER'), deleteJob);

// GET    /api/v1/jobs/:id/applications — RECRUITER only (nested)
router.get('/:id/applications', authenticateToken, requireRole('RECRUITER'), getJobApplications);

module.exports = router;

/**
 * Application Routes
 */

const express = require('express');
const router = express.Router();

const {
  createApplication,
  getMyApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// POST  /api/v1/applications — STUDENT only
router.post('/', authenticateToken, requireRole('STUDENT'), createApplication);

// GET   /api/v1/applications/my — STUDENT only (supports alias /me)
router.get('/my', authenticateToken, requireRole('STUDENT'), getMyApplications);
router.get('/me', authenticateToken, requireRole('STUDENT'), getMyApplications);

// PATCH /api/v1/applications/:id/status — RECRUITER only
router.patch('/:id/status', authenticateToken, requireRole('RECRUITER'), updateApplicationStatus);

module.exports = router;

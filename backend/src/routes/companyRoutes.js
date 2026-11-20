/**
 * Company Routes
 * Manages recruiter company profile viewing, editing, and public details.
 */

const express = require('express');
const router = express.Router();

const {
  getMyCompanyProfile,
  updateMyCompanyProfile,
  getCompanyById,
} = require('../controllers/companyController');

const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { publicApiLimiter } = require('../middleware/rateLimiter');

// GET   /api/v1/companies/profile — RECRUITER only (own profile)
router.get('/profile', authenticateToken, requireRole('RECRUITER'), getMyCompanyProfile);

// PUT   /api/v1/companies/profile — RECRUITER only (update own profile)
router.put('/profile', authenticateToken, requireRole('RECRUITER'), updateMyCompanyProfile);

// GET   /api/v1/companies/:id — Authenticated or public inspection
router.get('/:id', publicApiLimiter, optionalAuth, getCompanyById);

module.exports = router;

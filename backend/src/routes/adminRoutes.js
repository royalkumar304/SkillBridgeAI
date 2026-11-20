/**
 * University Admin Routes (Day 5)
 * Protected strictly for UNIVERSITY_ADMIN role with valid JWT.
 */

const express = require('express');
const router = express.Router();

const {
  getAdminStats,
  getAdminStudents,
  getAdminCompanies,
  verifyCompany,
  getCurriculumGap,
  getIndustrySkillDemand,
  getIndustryPartners,
  getAdminInternships
} = require('../controllers/adminController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Guard all admin routes with authentication and UNIVERSITY_ADMIN role
router.use(authenticateToken);
router.use(requireRole('UNIVERSITY_ADMIN'));

// GET   /api/v1/admin/stats — real platform statistics
router.get('/stats', getAdminStats);

// GET   /api/v1/admin/students — filterable & paginated student directory
router.get('/students', getAdminStudents);

// GET   /api/v1/admin/companies — recruiter company list with active job counts
router.get('/companies', getAdminCompanies);

// PATCH /api/v1/admin/companies/:id/verify — approve or revoke company verification
router.patch('/companies/:id/verify', verifyCompany);

// GET   /api/v1/admin/curriculum-gap — campus-wide skill demand vs supply heatmap
router.get('/curriculum-gap', getCurriculumGap);

// GET   /api/v1/admin/industry-skill-demand — calculate actual skill demand from active jobs/internships
router.get('/industry-skill-demand', getIndustrySkillDemand);

// GET   /api/v1/admin/industry-partners — detailed partners with active jobs/internships/selections
router.get('/industry-partners', getIndustryPartners);

// GET   /api/v1/admin/internships — all internships with applicant & selected counts
router.get('/internships', getAdminInternships);

module.exports = router;

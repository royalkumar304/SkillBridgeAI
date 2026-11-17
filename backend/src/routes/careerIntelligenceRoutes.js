/**
 * Career Intelligence Routes
 * Endpoints for Skill Gap Analysis, Personalized Learning Recommendations,
 * Career Readiness Score & Breakdown, and Job-Wise Career Analysis.
 */

const express = require('express');
const router = express.Router();

const {
  getCareerReadiness,
  getSkillGapAnalysis,
  getLearningRecommendations,
  getJobWiseAnalysis,
} = require('../controllers/careerIntelligenceController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All career intelligence endpoints require authenticated STUDENT role
router.use(authenticateToken, requireRole('STUDENT'));

// GET /api/v1/career/readiness — Overall Readiness Score, Breakdown & Improvement Areas
router.get('/readiness', getCareerReadiness);

// GET /api/v1/career/gap-analysis — Skill Gap Analysis (supports ?jobId= or ?targetRole=)
router.get('/gap-analysis', getSkillGapAnalysis);

// GET /api/v1/career/recommendations — Targeted Learning Path with verified resources
router.get('/recommendations', getLearningRecommendations);

// GET /api/v1/career/jobs-analysis — Comparative multi-job readiness analysis
router.get('/jobs-analysis', getJobWiseAnalysis);

module.exports = router;

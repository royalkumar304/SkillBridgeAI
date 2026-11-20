const express = require('express');
const router = express.Router();
const { getHealthStatus, getReadinessStatus } = require('../controllers/healthController');

// Liveness probe
router.get('/health', getHealthStatus);

// Readiness probe
router.get('/ready', getReadinessStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { issueCsrfToken } = require('../middleware/csrfMiddleware');

// Security rate limiter for authentication endpoints (bypassed in test environment)
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // max 100 requests per IP per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too Many Requests',
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      },
    });

router.get('/csrf-token', issueCsrfToken);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateToken, getMe);
router.post('/logout', optionalAuth, logout);

module.exports = router;

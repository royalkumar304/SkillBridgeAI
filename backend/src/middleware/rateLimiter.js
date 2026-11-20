const rateLimit = require('express-rate-limit');

/**
 * In-memory Rate Limiting Configuration for SkillBridge AI
 * 
 * Note: Uses in-memory Map store by default.
 * In a distributed, multi-instance production environment,
 * a Redis-backed store (e.g. rate-limit-redis) is required.
 */

const isTest = process.env.NODE_ENV === 'test';
const passThrough = (req, res, next) => next();

// General Public API Limiter (browsing jobs, viewing public company profiles)
const publicApiLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // 300 requests per 15 min per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too Many Requests',
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
      },
    });

// Strict Limiter for Search / Query intensive endpoints
const searchLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 search requests per minute per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too Many Requests',
        message: 'Search query rate limit exceeded. Please slow down your requests.',
      },
    });

// Strict Limiter for File Uploads and AI Processing
const uploadLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 30, // 30 uploads per 15 min per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too Many Requests',
        message: 'File upload rate limit exceeded. Please try again later.',
      },
    });

module.exports = {
  publicApiLimiter,
  searchLimiter,
  uploadLimiter,
};

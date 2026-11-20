const crypto = require('crypto');
const { getCsrfConfig } = require('../config/csrf');

/**
 * Signed Double-Submit Cookie CSRF Defense
 * 
 * Provides defense-in-depth against subdomain cookie injection:
 * Token format: `${nonce}.${hmacSignature}`
 * 
 * 1. The server signs the random nonce with a cryptographically dedicated CSRF_SIGNING_SECRET (HMAC-SHA256).
 * 2. Cryptographic key separation ensures that JWT_SECRET is never reused for CSRF validation.
 * 3. An attacker on a sibling domain or compromised subdomain cannot inject an arbitrary
 *    valid matching cookie and header because they cannot compute the HMAC signature.
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_HEADER_ALT = 'x-xsrf-token';

const isProduction = process.env.NODE_ENV === 'production';

const getCsrfCookieOptions = () => ({
  httpOnly: false, // Must be readable by client JS to read and attach to header
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

const signNonce = (nonce) => {
  const secret = getCsrfConfig().secret;
  return crypto.createHmac('sha256', secret).update(nonce).digest('hex');
};

const generateCsrfToken = () => {
  const nonce = crypto.randomBytes(32).toString('hex');
  const signature = signNonce(nonce);
  return `${nonce}.${signature}`;
};

const verifyCsrfTokenSignature = (token) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [nonce, signature] = parts;
  if (!nonce || !signature) return false;

  const expectedSignature = signNonce(nonce);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  return true;
};

/**
 * Endpoint handler: Issues CSRF token cookie & JSON response
 */
const issueCsrfToken = (req, res) => {
  let token = req.cookies && req.cookies[CSRF_COOKIE_NAME];
  if (!token || !verifyCsrfTokenSignature(token)) {
    token = generateCsrfToken();
  }
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return res.status(200).json({
    success: true,
    csrfToken: token,
  });
};

/**
 * Middleware: Validates CSRF token on state-changing HTTP methods
 */
const validateCsrf = (req, res, next) => {
  // Safe HTTP methods do not change state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Trusted Origin / Referer Validation for browser state-changing requests
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const allowedOriginSet = new Set([
    clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
  ]);

  if (origin) {
    if (!allowedOriginSet.has(origin)) {
      return res.status(403).json({
        success: false,
        error: 'EINVALIDORIGIN',
        message: 'Cross-origin request rejected: untrusted Origin header.',
      });
    }
  } else if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!allowedOriginSet.has(refererOrigin)) {
        return res.status(403).json({
          success: false,
          error: 'EINVALIDORIGIN',
          message: 'Cross-origin request rejected: untrusted Referer header.',
        });
      }
    } catch (_) {
      return res.status(403).json({
        success: false,
        error: 'EINVALIDORIGIN',
        message: 'Malformed Referer header.',
      });
    }
  } else if (isProduction && !req.headers.authorization) {
    // In strict production, browser state-changing requests without Origin/Referer are rejected
    return res.status(403).json({
      success: false,
      error: 'EMISSINGORIGIN',
      message: 'State-changing browser requests must include a trusted Origin or Referer header.',
    });
  }

  const { AUTH_COOKIE_NAME } = require('../config/cookie');
  const hasAuthCookie = Boolean(req.cookies && req.cookies[AUTH_COOKIE_NAME]);
  const authHeader = req.headers.authorization;
  const hasBearer = Boolean(authHeader && authHeader.startsWith('Bearer '));

  // Public unauthenticated entry points (login & registration) do not require CSRF token
  // because the user has not established a session yet
  const publicUnauthPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/logout',
  ];
  if (publicUnauthPaths.some((p) => req.path === p || req.originalUrl?.startsWith(p))) {
    return next();
  }

  // If request contains an authentication cookie (ambient credentials), strictly enforce CSRF!
  // CRITICAL SECURITY RULE: Do not allow a Bearer header to bypass CSRF when an authentication cookie is present.
  if (hasAuthCookie) {
    const cookieToken = req.cookies && req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers[CSRF_HEADER_ALT];

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        success: false,
        error: 'EBADCSRFTOKEN',
        message: 'CSRF token missing. Please refresh and try again.',
      });
    }

    // 1. Verify that the token carries a valid cryptographic HMAC signature
    if (!verifyCsrfTokenSignature(cookieToken) || !verifyCsrfTokenSignature(headerToken)) {
      return res.status(403).json({
        success: false,
        error: 'EBADCSRFTOKEN',
        message: 'Invalid or forged CSRF token signature.',
      });
    }

    // 2. Timing-safe comparison to prevent timing attacks
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);

    if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
      return res.status(403).json({
        success: false,
        error: 'EBADCSRFTOKEN',
        message: 'Invalid CSRF token.',
      });
    }

    return next();
  }

  // If there is no auth cookie, but request is authenticated via Bearer token (CLI / API client),
  // non-browser ambient CSRF attacks are not applicable because Bearer headers are not attached automatically by browsers.
  if (hasBearer) {
    return next();
  }

  // If there is no auth cookie and no Bearer token, allow downstream middleware to handle authentication
  // (e.g. unauthenticated logout clears cookie cleanly; protected routes return standard 401 Unauthorized)
  next();
};

module.exports = {
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
  issueCsrfToken,
  validateCsrf,
};

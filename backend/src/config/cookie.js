/**
 * Cookie configuration helper for SkillBridge AI
 * Configures HttpOnly authentication cookie options safely based on environment.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Returns cookie options for the auth token
 * @returns {object} Express cookie options
 */
const getAuthCookieOptions = () => {
  return {
    httpOnly: true, // Prevents XSS-based JavaScript access
    secure: isProduction, // Set to true only in production over HTTPS
    sameSite: isProduction ? 'strict' : 'lax', // CSRF defense
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
};

/**
 * Returns matching options for clearing the auth cookie
 * @returns {object} Express clearCookie options
 */
const getClearCookieOptions = () => {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };
};

module.exports = {
  AUTH_COOKIE_NAME: 'skillbridge_token',
  getAuthCookieOptions,
  getClearCookieOptions,
};

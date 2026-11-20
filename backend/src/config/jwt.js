/**
 * Centralized JWT Security Configuration & Validation
 *
 * Requirements:
 * - Reject missing JWT_SECRET.
 * - Reject weak or insufficiently long secrets (< 32 characters / 256 bits).
 * - Reject insecure default / known fallback secrets.
 * - Standardize signing algorithm (HS256).
 * - Enforce consistent token expiration (default: 7d).
 * - Standardize issuer and audience claims.
 * - Never log or print the actual secret.
 */

const KNOWN_INSECURE_SECRETS = new Set([
  'super_secret_jwt_key_skillbridge_2026',
  'your_jwt_secret',
  'your_strong_jwt_secret_here',
  'secret123',
  'secret',
  'jwtsecret',
  'defaultsecret',
  'development',
  'changeme',
]);

const MIN_SECRET_LENGTH = 32; // 256 bits minimum

function validateJwtSecret(secret) {
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION] JWT_SECRET environment variable is missing. ' +
      'SkillBridge AI requires a cryptographically strong JWT_SECRET to start securely.'
    );
  }

  const trimmed = secret.trim();

  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[FATAL SECURITY CONFIGURATION] JWT_SECRET is insufficiently long (${trimmed.length} characters). ` +
      `A minimum length of ${MIN_SECRET_LENGTH} characters (256-bit entropy) is strictly required.`
    );
  }

  if (KNOWN_INSECURE_SECRETS.has(trimmed.toLowerCase())) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION] JWT_SECRET matches a known insecure default or fallback value. ' +
      'Please generate a cryptographically strong random secret (e.g. using crypto.randomBytes(32).toString("hex")).'
    );
  }

  return trimmed;
}

function getJwtConfig() {
  const secret = validateJwtSecret(process.env.JWT_SECRET);
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const issuer = process.env.JWT_ISSUER || 'skillbridge-ai';
  const audience = process.env.JWT_AUDIENCE || 'skillbridge-users';
  const algorithm = 'HS256';

  return {
    secret,
    expiresIn,
    issuer,
    audience,
    algorithm,
    algorithms: [algorithm],
  };
}

module.exports = {
  validateJwtSecret,
  getJwtConfig,
  MIN_SECRET_LENGTH,
  KNOWN_INSECURE_SECRETS,
};

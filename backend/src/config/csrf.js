/**
 * Centralized CSRF Signing Secret Configuration & Validation
 * Enforces cryptographic key separation between JWT_SECRET and CSRF signing secret.
 */

const crypto = require('crypto');

const MIN_SECRET_LENGTH = 32; // 256 bits minimum

function validateCsrfSecret(secret, env = process.env) {
  const isProduction = env.NODE_ENV === 'production';

  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    // In production, an explicitly set, dedicated CSRF_SIGNING_SECRET is strictly required
    if (isProduction) {
      throw new Error(
        '[FATAL SECURITY CONFIGURATION] CSRF_SIGNING_SECRET environment variable is missing in production. ' +
        'Production deployments must configure a dedicated, cryptographically strong CSRF_SIGNING_SECRET.'
      );
    }

    // In local development or test environments only: derive a cryptographically segregated
    // subkey from JWT_SECRET using HKDF/HMAC so local development runs seamlessly without key reuse.
    const jwtSecret = env.JWT_SECRET;
    if (jwtSecret && jwtSecret.trim().length >= 32) {
      return crypto
        .createHmac('sha256', jwtSecret.trim())
        .update('SkillBridge-AI-Dedicated-CSRF-Key-Derivation-Salt')
        .digest('hex');
    }
    throw new Error(
      '[FATAL SECURITY CONFIGURATION] CSRF_SIGNING_SECRET or valid JWT_SECRET is required with at least 32 characters.'
    );
  }

  const trimmed = secret.trim();
  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[FATAL SECURITY CONFIGURATION] CSRF_SIGNING_SECRET is insufficiently long (${trimmed.length} chars). ` +
      `A minimum length of ${MIN_SECRET_LENGTH} characters (256 bits) is required.`
    );
  }

  return trimmed;
}

function getCsrfConfig() {
  const secret = validateCsrfSecret(process.env.CSRF_SIGNING_SECRET);
  return {
    secret,
  };
}

module.exports = {
  validateCsrfSecret,
  getCsrfConfig,
  MIN_SECRET_LENGTH,
};

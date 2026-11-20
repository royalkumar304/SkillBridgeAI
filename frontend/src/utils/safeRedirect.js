/**
 * URL Sanitization & Safe Redirect Utility for SkillBridge AI
 *
 * Defends against:
 * - Protocol-relative URL redirects (e.g. "//evil.com")
 * - Backslash redirection bypasses (e.g. "/\\evil.com" or "\evil.com")
 * - Dangerous URI schemes (e.g. "javascript:", "data:", "vbscript:", "file:")
 * - External domain redirects when an internal route is expected
 */

export function sanitizeRedirectPath(path, fallback = '/') {
  if (!path || typeof path !== 'string') {
    return fallback;
  }

  const trimmed = path.trim();

  // Must begin with a single slash and NOT double slash (protocol-relative) or backslash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return fallback;
  }

  // Reject dangerous pseudo-protocols even if preceded by slash
  const dangerousPatterns = [/javascript:/i, /data:/i, /vbscript:/i, /file:/i];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return fallback;
    }
  }

  // Reject URL control characters and backslashes anywhere in the target pathname
  if (/[\r\n\t\\]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

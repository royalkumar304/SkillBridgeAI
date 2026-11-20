/**
 * Safe Regex & Query Sanitization Utility
 * Mitigates ReDoS, MongoDB operator injection, and type-confusion attacks.
 */

const MAX_SEARCH_LENGTH = 100;

/**
 * Escapes all regular expression metacharacters in user-supplied strings.
 * @param {string} str 
 * @returns {string} Escaped string safe for RegExp
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates and sanitizes a user search query parameter.
 * - Rejects non-string inputs (objects, arrays, functions, undefined).
 * - Enforces max length ceiling (100 characters) to prevent memory/CPU exhaustion.
 * - Escapes regex special characters.
 * 
 * @param {any} input 
 * @returns {string|null} Sanitized string or null if invalid/empty
 */
const sanitizeSearchQuery = (input) => {
  if (input === undefined || input === null) return null;
  
  // Reject MongoDB operator injection payloads like { $ne: null } or arrays
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Disallow excessively long search payloads to avoid ReDoS / memory DOS
  if (trimmed.length > MAX_SEARCH_LENGTH) {
    return escapeRegex(trimmed.substring(0, MAX_SEARCH_LENGTH));
  }

  return escapeRegex(trimmed);
};

/**
 * Creates a safe, bounded case-insensitive RegExp from user input.
 * Returns null if input is invalid or blank.
 * 
 * @param {any} input 
 * @returns {RegExp|null}
 */
const createSafeSearchRegex = (input) => {
  const sanitized = sanitizeSearchQuery(input);
  if (!sanitized) return null;
  try {
    return new RegExp(sanitized, 'i');
  } catch (err) {
    return null;
  }
};

/**
 * Sanitizes and bounds pagination parameters.
 * 
 * @param {any} page 
 * @param {any} limit 
 * @param {number} defaultLimit 
 * @param {number} maxLimit 
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (page, limit, defaultLimit = 10, maxLimit = 50) => {
  let parsedPage = parseInt(page, 10);
  if (isNaN(parsedPage) || parsedPage < 1) {
    parsedPage = 1;
  }

  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    parsedLimit = defaultLimit;
  } else if (parsedLimit > maxLimit) {
    parsedLimit = maxLimit;
  }

  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};

/**
 * Validates and normalizes sort fields and directions against an allowlist.
 * 
 * @param {any} sortField 
 * @param {any} sortOrder 
 * @param {string[]} allowedFields 
 * @param {string} defaultField 
 * @param {string} defaultOrder 
 * @returns {object} MongoDB sort object
 */
const parseSorting = (sortField, sortOrder, allowedFields = ['createdAt'], defaultField = 'createdAt', defaultOrder = -1) => {
  let field = defaultField;
  if (typeof sortField === 'string' && allowedFields.includes(sortField.trim())) {
    field = sortField.trim();
  }

  let order = defaultOrder;
  if (typeof sortOrder === 'string') {
    const o = sortOrder.trim().toLowerCase();
    if (o === 'asc' || o === '1') order = 1;
    else if (o === 'desc' || o === '-1') order = -1;
  } else if (typeof sortOrder === 'number' && (sortOrder === 1 || sortOrder === -1)) {
    order = sortOrder;
  }

  // Always include _id as a unique deterministic tie-breaker
  return { [field]: order, _id: order };
};

module.exports = {
  escapeRegex,
  sanitizeSearchQuery,
  createSafeSearchRegex,
  parsePagination,
  parseSorting,
};

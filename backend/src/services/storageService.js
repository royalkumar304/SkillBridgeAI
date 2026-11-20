/**
 * Storage Service Abstraction
 * Supports secure local development storage and cloud-ready object storage interfaces.
 * Enforces file size limits, magic number PDF verification (%PDF-), path traversal immunity,
 * and SHA-256 checksum generation.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Private storage directory outside public web root
const STORAGE_ROOT = process.env.STORAGE_LOCAL_DIR
  ? path.resolve(process.env.STORAGE_LOCAL_DIR)
  : path.resolve(__dirname, '../../storage/resumes');

// Ensure root directory exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true, mode: 0o700 });
}

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

class StorageService {
  /**
   * Validates file buffer for PDF magic numbers (%PDF-) and size limits.
   * @param {Buffer} buffer File buffer
   * @param {string} originalFilename Original uploaded filename
   */
  static validatePdfBuffer(buffer, originalFilename = '') {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new Error('File buffer is empty or invalid.');
    }

    if (buffer.length > MAX_RESUME_SIZE_BYTES) {
      throw new Error(`File exceeds maximum allowed size of 5MB. Provided: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`);
    }

    if (originalFilename) {
      const ext = path.extname(originalFilename).toLowerCase();
      if (ext !== '.pdf') {
        throw new Error(`Invalid file extension "${ext}". Only PDF documents (.pdf) are permitted.`);
      }
    }

    // PDF Magic Number Verification (%PDF-)
    // First 4 bytes must be 0x25, 0x50, 0x44, 0x46 (%PDF)
    const magic = buffer.subarray(0, 5).toString('ascii');
    if (!magic.startsWith('%PDF-')) {
      throw new Error('Invalid file signature. File is not a valid PDF document.');
    }

    return true;
  }

  /**
   * Computes SHA-256 checksum for integrity and deduplication.
   * @param {Buffer} buffer 
   * @returns {string} Hex-encoded SHA-256 hash
   */
  static calculateChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates a safe, sanitized filename.
   * Strips directory separators, null bytes, and non-alphanumeric chars.
   * @param {string} rawFilename
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(rawFilename) {
    const basename = path.basename(rawFilename || 'resume.pdf');
    // Remove null bytes and path traversal chars
    const cleaned = basename.replace(/[\0\/\\]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    return cleaned.endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
  }

  /**
   * Saves buffer to private storage using an opaque UUID storageKey.
   * @param {Buffer} buffer 
   * @param {string} originalFilename 
   * @returns {Promise<{ storageKey: string, safeFilename: string, checksum: string, fileSize: number }>}
   */
  static async saveFile(buffer, originalFilename = 'resume.pdf') {
    this.validatePdfBuffer(buffer, originalFilename);

    const checksum = this.calculateChecksum(buffer);
    const safeFilename = this.sanitizeFilename(originalFilename);
    const storageKey = `${crypto.randomUUID()}.pdf`;
    const destinationPath = path.join(STORAGE_ROOT, storageKey);

    // Prevent directory traversal
    if (!destinationPath.startsWith(STORAGE_ROOT)) {
      throw new Error('Path traversal attempt detected in storage key resolution.');
    }

    await fs.promises.writeFile(destinationPath, buffer, { mode: 0o600 });

    return {
      storageKey,
      safeFilename,
      checksum,
      fileSize: buffer.length,
      storageProvider: 'local',
    };
  }

  /**
   * Retrieves file stream or buffer from storage.
   * @param {string} storageKey 
   * @returns {Promise<Buffer>}
   */
  static async getFile(storageKey) {
    if (!storageKey || typeof storageKey !== 'string') {
      throw new Error('Invalid storage key provided.');
    }

    // Guard against path traversal in key
    const sanitizedKey = path.basename(storageKey);
    const filePath = path.join(STORAGE_ROOT, sanitizedKey);

    if (!filePath.startsWith(STORAGE_ROOT)) {
      throw new Error('Path traversal attempt detected.');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in storage repository.');
    }

    return await fs.promises.readFile(filePath);
  }

  /**
   * Checks if file exists in storage.
   * @param {string} storageKey 
   * @returns {boolean}
   */
  static fileExists(storageKey) {
    if (!storageKey) return false;
    const sanitizedKey = path.basename(storageKey);
    const filePath = path.join(STORAGE_ROOT, sanitizedKey);
    return filePath.startsWith(STORAGE_ROOT) && fs.existsSync(filePath);
  }

  /**
   * Deletes file from storage.
   * @param {string} storageKey 
   */
  static async deleteFile(storageKey) {
    if (!storageKey) return;
    const sanitizedKey = path.basename(storageKey);
    const filePath = path.join(STORAGE_ROOT, sanitizedKey);

    if (filePath.startsWith(STORAGE_ROOT) && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn(`[StorageService] Failed to unlink file ${filePath}: ${err.message}`);
      }
    }
  }
}

module.exports = StorageService;

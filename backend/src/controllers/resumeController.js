/**
 * Resume Controller
 * Handles secure resume upload, storage, metadata persistence, versioning,
 * access control, secure streaming/download, and deletion.
 */

const path = require('path');
const { Resume, StudentProfile, Application, Job, Company, User } = require('../models');
const StorageService = require('../services/storageService');
const AIClientService = require('../services/aiClientService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { parseMultipartFormData } = require('../utils/multipartParser');
const { normalizeSkillName, compareLevels } = require('../utils/skillTaxonomy');

/**
 * POST /api/v1/students/resume
 * Authenticated student uploads a new PDF resume.
 * 1. Validates file (size, extension, magic %PDF- header).
 * 2. Saves to private storage with opaque UUID key.
 * 3. Deactivates previous active resume records.
 * 4. Persists new Resume document with version number.
 * 5. Calls AI microservice for NLP skill extraction.
 * 6. Updates extraction status and synchronizes skills to StudentProfile with resume_extracted provenance.
 */
const uploadResume = async (req, res) => {
  let savedFileRecord = null;
  try {
    const userId = req.user.id;

    // 1. Parse multipart form data
    let uploadedFile;
    try {
      uploadedFile = await parseMultipartFormData(req);
    } catch (parseErr) {
      return errorResponse(res, 400, 'Bad Request', parseErr.message);
    }

    const { filename, buffer } = uploadedFile;

    // 2. Validate PDF signature, extension, and size
    try {
      StorageService.validatePdfBuffer(buffer, filename);
    } catch (valErr) {
      return errorResponse(res, 400, 'Validation Error', valErr.message);
    }

    // 3. Save to storage abstraction
    savedFileRecord = await StorageService.saveFile(buffer, filename);

    // 4. Concurrency-safe deactivation and version calculation
    // Mark any existing active resumes as inactive
    await Resume.updateMany({ userId, isActive: true }, { $set: { isActive: false } });

    const existingCount = await Resume.countDocuments({ userId });
    const nextVersion = existingCount + 1;

    // 5. Create Resume MongoDB record with PROCESSING status
    let resumeDoc;
    try {
      resumeDoc = new Resume({
        userId,
        originalFilename: filename,
        safeFilename: savedFileRecord.safeFilename,
        mimeType: 'application/pdf',
        fileSize: savedFileRecord.fileSize,
        storageProvider: savedFileRecord.storageProvider,
        storageKey: savedFileRecord.storageKey,
        checksum: savedFileRecord.checksum,
        extractionStatus: 'PROCESSING',
        version: nextVersion,
        isActive: true,
      });
      await resumeDoc.save();
    } catch (saveErr) {
      // If a concurrent upload collided on the unique partial index { userId: 1, isActive: 1 },
      // deactivate any remaining active resumes and retry once.
      if (saveErr.code === 11000) {
        await Resume.updateMany({ userId, isActive: true }, { $set: { isActive: false } });
        const recount = await Resume.countDocuments({ userId });
        resumeDoc = new Resume({
          userId,
          originalFilename: filename,
          safeFilename: savedFileRecord.safeFilename,
          mimeType: 'application/pdf',
          fileSize: savedFileRecord.fileSize,
          storageProvider: savedFileRecord.storageProvider,
          storageKey: savedFileRecord.storageKey,
          checksum: savedFileRecord.checksum,
          extractionStatus: 'PROCESSING',
          version: recount + 1,
          isActive: true,
        });
        await resumeDoc.save();
      } else {
        throw saveErr;
      }
    }

    // 6. Update student profile reference
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({ userId, skills: [] });
    }
    profile.resumeId = resumeDoc._id;
    profile.resumeUrl = `/api/v1/students/resume/${resumeDoc._id}/download`;

    // 7. Call AI microservice for text & NLP skill extraction
    let aiResult = null;
    try {
      aiResult = await AIClientService.uploadResumePdf(buffer, filename);
    } catch (aiErr) {
      console.warn(`[ResumeController] AI skill extraction failed for resume ${resumeDoc._id}: ${aiErr.message}`);
    }

    if (aiResult && aiResult.success) {
      resumeDoc.extractionStatus = 'COMPLETED';
      resumeDoc.extractedSkills = aiResult.extracted_skills || [];
      resumeDoc.skillDetails = aiResult.skill_details || [];
      resumeDoc.pageCount = aiResult.page_count || 1;
      resumeDoc.characterCount = aiResult.character_count || 0;
      resumeDoc.extractedTextPreview = aiResult.extracted_text_preview || '';
      await resumeDoc.save();

      // Synchronize extracted skills to student profile with authentic resume_extracted provenance
      const existingSkillMap = new Map();
      (profile.skills || []).forEach((s) => {
        if (s && s.name) {
          existingSkillMap.set(s.name.trim().toLowerCase(), s);
        }
      });

      (aiResult.extracted_skills || []).forEach((skillName) => {
        const canonical = normalizeSkillName(skillName);
        if (!canonical) return;
        const key = canonical.toLowerCase();

        if (existingSkillMap.has(key)) {
          const existing = existingSkillMap.get(key);
          // Upgrade if resume extraction implies intermediate competence
          if (compareLevels('intermediate', existing.level) > 0) {
            existing.level = 'intermediate';
          }
          if (existing.source !== 'assessment_verified') {
            existing.source = 'resume_extracted';
          }
        } else {
          existingSkillMap.set(key, {
            name: canonical,
            level: 'intermediate',
            source: 'resume_extracted',
          });
        }
      });

      profile.skills = Array.from(existingSkillMap.values());
    } else {
      resumeDoc.extractionStatus = 'FAILED';
      await resumeDoc.save();
    }

    await profile.save();

    return successResponse(res, 201, 'Resume uploaded and parsed successfully', {
      resume: {
        id: resumeDoc._id,
        filename: resumeDoc.originalFilename,
        version: resumeDoc.version,
        fileSize: resumeDoc.fileSize,
        extractionStatus: resumeDoc.extractionStatus,
        extractedSkills: resumeDoc.extractedSkills,
        uploadedAt: resumeDoc.uploadedAt,
      },
    });
  } catch (error) {
    console.error('[ResumeController.uploadResume]', error);
    // Cleanup orphaned storage file on failure
    if (savedFileRecord && savedFileRecord.storageKey) {
      await StorageService.deleteFile(savedFileRecord.storageKey);
    }
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/students/resume
 * Retrieves active and historical resumes for the authenticated student.
 */
const getMyResumes = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumes = await Resume.find({ userId }).sort({ version: -1 });

    const activeResume = resumes.find((r) => r.isActive) || null;

    return successResponse(res, 200, 'Resumes retrieved successfully', {
      activeResume: activeResume
        ? {
            id: activeResume._id,
            filename: activeResume.originalFilename,
            version: activeResume.version,
            fileSize: activeResume.fileSize,
            extractionStatus: activeResume.extractionStatus,
            extractedSkills: activeResume.extractedSkills,
            uploadedAt: activeResume.uploadedAt,
            downloadUrl: `/api/v1/students/resume/${activeResume._id}/download`,
          }
        : null,
      history: resumes.map((r) => ({
        id: r._id,
        filename: r.originalFilename,
        version: r.version,
        fileSize: r.fileSize,
        isActive: r.isActive,
        extractionStatus: r.extractionStatus,
        uploadedAt: r.uploadedAt,
        downloadUrl: `/api/v1/students/resume/${r._id}/download`,
      })),
    });
  } catch (error) {
    console.error('[ResumeController.getMyResumes]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/students/resume/:resumeId/download
 * Secure resume download endpoint with strict ownership and authorization.
 * - STUDENT: can download own resume.
 * - RECRUITER: can download only if the student applied to one of the recruiter's company jobs.
 * - UNIVERSITY_ADMIN: can download for audit purposes.
 */
const downloadResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return errorResponse(res, 404, 'Not Found', 'Resume document not found.');
    }

    // Authorization check
    let isAuthorized = false;

    if (req.user.role === 'STUDENT' && resume.userId.toString() === req.user.id) {
      isAuthorized = true;
    } else if (req.user.role === 'UNIVERSITY_ADMIN') {
      // University admin authorization: enforce strict institutional tenancy
      // A university admin must have an authoritative university affiliation in their server User record.
      // Blanket university-admin access without affiliation is strictly prohibited.
      const adminUser = await User.findById(req.user.id, 'university');
      const adminUniversity = (adminUser && adminUser.university) ? adminUser.university.trim() : (req.user.university ? String(req.user.university).trim() : null);

      if (!adminUniversity) {
        // Missing admin university affiliation results in access denied
        isAuthorized = false;
      } else {
        const studentProfile = await StudentProfile.findOne({ userId: resume.userId }, 'university');
        const studentUniversity = (studentProfile && studentProfile.university) ? studentProfile.university.trim() : null;

        if (studentUniversity && studentUniversity.toLowerCase() === adminUniversity.toLowerCase()) {
          isAuthorized = true;
        } else {
          isAuthorized = false;
        }
      }
    } else if (req.user.role === 'RECRUITER') {
      // Check that recruiter belongs to a currently verified company
      const verifiedCompany = await Company.findOne({
        recruiterUserId: req.user.id,
        verified: true,
        verificationStatus: 'APPROVED',
      });

      if (verifiedCompany) {
        // Check if student applied to any job owned by recruiter
        const recruiterJobs = await Job.find({ postedBy: req.user.id }, '_id');
        const jobIds = recruiterJobs.map((j) => j._id);
        const application = await Application.findOne({
          studentId: resume.userId,
          jobId: { $in: jobIds },
        });
        if (application) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return errorResponse(res, 403, 'Forbidden', 'You are not authorized to download this resume.');
    }

    // Retrieve file buffer from storage abstraction
    let fileBuffer;
    try {
      fileBuffer = await StorageService.getFile(resume.storageKey);
    } catch (storeErr) {
      return errorResponse(res, 404, 'Not Found', 'Resume file not found in storage.');
    }

    // Set secure response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${resume.safeFilename || 'resume.pdf'}"`
    );
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).send(fileBuffer);
  } catch (error) {
    console.error('[ResumeController.downloadResume]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * DELETE /api/v1/students/resume/:resumeId
 * Deletes a resume record and its underlying stored file.
 * Only the owning student can delete their resume.
 */
const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return errorResponse(res, 404, 'Not Found', 'Resume record not found.');
    }

    if (resume.userId.toString() !== userId) {
      return errorResponse(res, 403, 'Forbidden', 'You are not authorized to delete this resume.');
    }

    // 1. Delete physical storage file
    await StorageService.deleteFile(resume.storageKey);

    // 2. Delete database record
    await Resume.findByIdAndDelete(resumeId);

    // 3. Update student profile reference if this was the active resume
    const profile = await StudentProfile.findOne({ userId });
    if (profile && profile.resumeId && profile.resumeId.toString() === resumeId) {
      // Find latest remaining resume, if any
      const remainingResume = await Resume.findOne({ userId }).sort({ version: -1 });
      if (remainingResume) {
        remainingResume.isActive = true;
        await remainingResume.save();
        profile.resumeId = remainingResume._id;
        profile.resumeUrl = `/api/v1/students/resume/${remainingResume._id}/download`;
      } else {
        profile.resumeId = null;
        profile.resumeUrl = '';
      }
      await profile.save();
    }

    return successResponse(res, 200, 'Resume deleted successfully.');
  } catch (error) {
    console.error('[ResumeController.deleteResume]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  uploadResume,
  getMyResumes,
  downloadResume,
  deleteResume,
};

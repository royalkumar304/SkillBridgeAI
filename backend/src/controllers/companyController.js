/**
 * Company Controller
 * Manages recruiter company profile viewing and updates.
 */

const mongoose = require('mongoose');
const Company = require('../models/Company');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { serializeCompany } = require('../utils/responseSerializers');

/**
 * GET /api/v1/companies/profile
 * RECRUITER only — get company profile for the authenticated recruiter.
 */
const getMyCompanyProfile = async (req, res) => {
  try {
    let company = await Company.findOne({ recruiterUserId: req.user.id });

    if (!company) {
      // Auto-provision basic company record if none exists yet
      const fallbackName = `${req.user.name || 'Recruiter'} Enterprises`;
      company = await Company.create({
        name: fallbackName,
        industry: 'Technology',
        location: 'Remote',
        recruiterUserId: req.user.id,
        verified: false,
      });
    }

    return successResponse(res, 200, 'Company profile retrieved successfully', { company });
  } catch (error) {
    console.error('[companyController.getMyCompanyProfile]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PUT /api/v1/companies/profile
 * RECRUITER only — update own company profile.
 */
const updateMyCompanyProfile = async (req, res) => {
  try {
    const { name, industry, description, website, location, contactEmail, contactPhone } = req.body;

    let company = await Company.findOne({ recruiterUserId: req.user.id });

    if (!company) {
      // Create new company for this recruiter
      if (!name || !industry) {
        return errorResponse(res, 400, 'Validation Error', 'Company name and industry are required');
      }

      company = await Company.create({
        name: name.trim(),
        industry: industry.trim(),
        description: description || '',
        website: website || '',
        location: location || 'Remote',
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
        recruiterUserId: req.user.id,
        verified: false,
      });
      return successResponse(res, 201, 'Company profile created successfully', { company });
    }

    // Check name uniqueness if name changed
    if (name && name.trim() !== company.name) {
      const existing = await Company.findOne({
        name: name.trim(),
        _id: { $ne: company._id },
      });
      if (existing) {
        return errorResponse(res, 409, 'Conflict', 'Another company is already registered with this name');
      }
      company.name = name.trim();
    }

    if (industry) company.industry = industry.trim();
    if (description !== undefined) company.description = description;
    if (website !== undefined) company.website = website;
    if (location !== undefined) company.location = location;
    if (contactEmail !== undefined) company.contactEmail = contactEmail;
    if (contactPhone !== undefined) company.contactPhone = contactPhone;

    await company.save();

    return successResponse(res, 200, 'Company profile updated successfully', { company });
  } catch (error) {
    console.error('[companyController.updateMyCompanyProfile]', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, 'Validation Error', error.message);
    }
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/companies/:id
 * Public / Authenticated — view details of a specific company with explicit PII redaction.
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid company ID format');
    }

    const company = await Company.findById(id).populate('recruiterUserId', 'name email');
    if (!company) {
      return errorResponse(res, 404, 'Not Found', 'Company not found');
    }

    const isOwner = req.user && company.recruiterUserId && (
      (company.recruiterUserId._id && company.recruiterUserId._id.toString() === req.user.id) ||
      company.recruiterUserId.toString() === req.user.id
    );
    const isAdmin = req.user && req.user.role === 'UNIVERSITY_ADMIN';

    const serialized = serializeCompany(company, { isOwner, isAdmin });

    return successResponse(res, 200, 'Company details retrieved successfully', { company: serialized });
  } catch (error) {
    console.error('[companyController.getCompanyById]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getMyCompanyProfile,
  updateMyCompanyProfile,
  getCompanyById,
};

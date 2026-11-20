/**
 * API Response Serializers for SkillBridge AI
 * Prevents mass-exposure of PII, recruiter credentials, and internal fields.
 */

/**
 * Serializes a Job object for public or candidate consumption.
 * Redacts recruiter personal information (name, email) while preserving
 * verified public company details.
 * 
 * @param {object} job - Raw or lean Job document
 * @param {object} options - Options { isOwner: boolean, isAdmin: boolean }
 * @returns {object} Safe serialized job
 */
const serializeJob = (job, options = {}) => {
  if (!job) return null;
  const doc = job.toObject ? job.toObject() : { ...job };
  const { isOwner = false, isAdmin = false } = options;

  // Build clean company representation
  let publicCompany = null;
  if (doc.companyId && typeof doc.companyId === 'object') {
    publicCompany = {
      id: doc.companyId._id || doc.companyId.id,
      name: doc.companyId.name,
      website: doc.companyId.website || '',
      industry: doc.companyId.industry || '',
      location: doc.companyId.location || '',
      logo: doc.companyId.logo || '',
      verified: Boolean(doc.companyId.verified),
    };
  }

  const serialized = {
    _id: doc._id,
    id: doc._id,
    title: doc.title,
    description: doc.description,
    companyId: publicCompany || doc.companyId,
    companyName: doc.companyName,
    location: doc.location,
    jobType: doc.jobType,
    workplaceType: doc.workplaceType,
    stipend: doc.stipend,
    salary: doc.salary,
    duration: doc.duration,
    requiredSkills: doc.requiredSkills || [],
    minCGPA: doc.minCGPA,
    eligibleDegrees: doc.eligibleDegrees || [],
    eligibleBranches: doc.eligibleBranches || [],
    eligibleGraduationYears: doc.eligibleGraduationYears || [],
    deadline: doc.deadline,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  // Only include postedBy details if requester is the recruiter owner or university admin
  if (isOwner || isAdmin) {
    if (doc.postedBy && typeof doc.postedBy === 'object') {
      serialized.postedBy = {
        id: doc.postedBy._id || doc.postedBy.id,
        name: doc.postedBy.name,
        email: doc.postedBy.email,
      };
    } else if (doc.postedBy) {
      serialized.postedBy = doc.postedBy;
    }
  }

  return serialized;
};

/**
 * Serializes a Company object for public consumption.
 * Strips recruiter personal user ID, unverified personal phones, and internal records.
 * 
 * @param {object} company - Raw or lean Company document
 * @param {object} options - { isOwner: boolean, isAdmin: boolean }
 * @returns {object} Safe serialized company
 */
const serializeCompany = (company, options = {}) => {
  if (!company) return null;
  const doc = company.toObject ? company.toObject() : { ...company };
  const { isOwner = false, isAdmin = false } = options;

  const publicData = {
    _id: doc._id,
    id: doc._id,
    name: doc.name,
    industry: doc.industry,
    description: doc.description || '',
    website: doc.website || '',
    location: doc.location || '',
    logo: doc.logo || '',
    verified: Boolean(doc.verified),
    verificationStatus: doc.verificationStatus,
    createdAt: doc.createdAt,
  };

  // Contact details only if requested by owner or admin
  if (isOwner || isAdmin) {
    publicData.contactEmail = doc.contactEmail || '';
    publicData.contactPhone = doc.contactPhone || '';
    publicData.recruiterUserId = doc.recruiterUserId;
    publicData.verifiedAt = doc.verifiedAt;
    publicData.verifiedBy = doc.verifiedBy;
  } else {
    // If contact email is explicitly provided and approved for public display
    if (doc.contactEmail && doc.verified) {
      publicData.contactEmail = doc.contactEmail;
    }
  }

  return publicData;
};

module.exports = {
  serializeJob,
  serializeCompany,
};

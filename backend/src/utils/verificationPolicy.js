/**
 * SkillBridge AI — Canonical Company Verification Policy
 *
 * Defines the single source of truth for company verification and public publishing eligibility.
 *
 * Invariant Rules:
 * - A company is considered verified if and only if:
 *     company.verified === true AND company.verificationStatus === 'APPROVED'
 * - If verificationStatus is 'PENDING', 'REJECTED', or 'REVOKED', the company is NOT verified,
 *   regardless of any contradictory field value.
 * - Legacy records (where verificationStatus is undefined):
 *     If verified is true, verificationStatus defaults safely to 'APPROVED'.
 *     Otherwise (verified is false, null, or undefined), verificationStatus defaults to 'PENDING'.
 */

function isCompanyVerified(company) {
  if (!company) return false;

  // If verificationStatus is explicitly defined, it must be APPROVED
  if (company.verificationStatus) {
    return company.verified === true && company.verificationStatus.toUpperCase() === 'APPROVED';
  }

  // Handle legacy records where verificationStatus field is not yet set
  return company.verified === true;
}

function getVerifiedCompanyQuery() {
  return {
    verified: true,
    $or: [
      { verificationStatus: 'APPROVED' },
      { verificationStatus: { $exists: false } },
      { verificationStatus: null },
    ],
  };
}

module.exports = {
  isCompanyVerified,
  getVerifiedCompanyQuery,
};

# PUBLIC API PRIVACY IMPLEMENTATION & DATA PROTECTION

**Project:** SkillBridge AI (SIH Problem Statement: SIH26044)  
**Date:** 2026-11-18  
**Classification:** `[FIXED]`, `[TESTED]`

---

## 1. Overview

In Prompt 10, all public and semi-public API endpoints in SkillBridge AI were systematically audited and hardened against personal data leakage, recruiter PII harvesting, NoSQL injection, and regex denial of service (ReDoS).

---

## 2. Implemented Privacy & Serialization Architecture

### 2.1 Explicit Response Serializers
Located at `backend/src/utils/responseSerializers.js`:
- **`serializeJob(job, { isOwner, isAdmin })`:**
  - Redacts recruiter personal information (`postedBy.email`, `postedBy.name`) for unauthenticated public viewers and candidates.
  - Sanitizes `companyId` into an approved public projection (`id`, `name`, `website`, `industry`, `location`, `logo`, `verified`).
  - Only exposes internal recruiter metadata if `isOwner === true` or `isAdmin === true`.
- **`serializeCompany(company, { isOwner, isAdmin })`:**
  - Strips `recruiterUserId`, internal flags, and private contact phone numbers.
  - Only reveals private company communications channels if the requester owns the corporate profile or is a verified University Admin.

### 2.2 Rate Limiting Protection
Located at `backend/src/middleware/rateLimiter.js`:
- Mounted on public job viewing (`/jobs`, `/jobs/:id`) and public company inspection (`/companies/:id`).
- Rate limiting ceiling: 300 requests per 15 minutes per IP for general browsing; 60 requests per minute for search; 30 requests per 15 minutes for uploads.
- Standard headers enabled (`RateLimit-Limit`, `RateLimit-Remaining`).
- *Note:* Backed by local in-memory store in development (`[REQUIRES PRODUCTION INFRASTRUCTURE]` for distributed Redis store).

---

## 3. Security Verification Summary

18 automated assertions in `backend/tests/security_public_api_privacy_suite.js` confirm:
1. Public job detail endpoints omit recruiter email.
2. Public job detail endpoints omit recruiter full name.
3. Public company inspection endpoints omit private contact phone and `recruiterUserId`.
4. Authenticated owners maintain legitimate access to their corporate profile.
5. Parameter tampering (`?userId=X`) by students to view other students' profiles is rejected.
6. Internal storage keys and paths are excluded from public responses.
7. Public endpoints adhere to bounded pagination and rate limits.

# API QUERY SECURITY, PAGINATION & INJECTION DEFENSE

**Project:** SkillBridge AI (SIH Problem Statement: SIH26044)  
**Date:** 2026-11-18  
**Classification:** `[FIXED]`, `[TESTED]`

---

## 1. Overview

This document specifies the query sanitization, NoSQL injection neutralization, and bounded pagination patterns implemented across the SkillBridge AI backend.

---

## 2. Query Sanitization Utility (`querySanitizer.js`)

### 2.1 Regex Escaping & ReDoS Protection
User-provided search strings are frequently evaluated using MongoDB's `$regex` operator. If metacharacters such as `*`, `+`, `(`, or `[` are evaluated raw, pathological inputs can trigger catastrophic backtracking in JavaScript's regular expression engine (ReDoS), locking up the single-threaded event loop.

- **Mitigation:**
  ```javascript
  const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  ```
- **Ceiling:** All queries are strictly truncated to a 100-character ceiling (`MAX_SEARCH_LENGTH = 100`).

### 2.2 NoSQL Operator Injection Neutralization
Query strings parsed by body/query parsers can interpret bracketed syntax (e.g. `?search[$ne]=1` or `?search[$gt]=`) as nested objects. If spread directly into MongoDB filters, this permits unauthorized record matching.

- **Mitigation:**
  `sanitizeSearchQuery(input)` strictly verifies `typeof input === 'string'`. If an object, array, or non-primitive is passed, the function returns `null`, discarding the operator payload.

### 2.3 Bounded Pagination
List endpoints (`/api/v1/jobs`, `/api/v1/admin/students`, `/api/v1/notifications`) enforce strict bounds:
- **Default Limit:** 10 (or 20 for admin tables).
- **Maximum Limit:** 50. Any query with `?limit=5000` is clamped to 50.
- **Negative Normalization:** Negative or non-numeric page values default safely to `page = 1`.
- **Tie-Breaker:** Safe sorting uses an allowlist (`createdAt`, `deadline`, `title`) and appends `_id: -1` as a deterministic tie-breaker.

---

## 3. Database Indexes

In `backend/src/models/Job.js`, the following compound indexes were provisioned to accelerate filtered queries:
- `jobSchema.index({ status: 1, deadline: 1 });`
- `jobSchema.index({ 'requiredSkills.name': 1 });`
- `jobSchema.index({ status: 1, createdAt: -1 });`
- `jobSchema.index({ companyId: 1, status: 1 });`

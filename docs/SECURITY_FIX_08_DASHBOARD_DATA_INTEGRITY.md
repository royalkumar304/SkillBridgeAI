# Security Fix 08: Dashboard Data Integrity, Fake Metrics & Authoritative Readiness Calculation Hardening

**Severity:** P0 — Data Integrity, Transparency, and Algorithmic Reliability  
**Service:** Full-Stack Monorepo (Frontend UI, Express Backend, FastAPI Engine, MongoDB Models)  
**Date:** November 17, 2026  
**Status:** Remediated & Fully Verified  

---

## 1. Executive Summary

Prior to this fix, the SkillBridge AI platform contained several data-integrity issues:
1. **Hardcoded Frontend Metrics:** `frontend/src/pages/student/StudentDashboard.jsx` initialized with a hardcoded career readiness score of `85.7%`, fake default extracted skills (`['AWS', 'Express', 'JavaScript', ...]`), and fixed missing critical skills.
2. **Artificial Student Profile Defaults:** `backend/src/models/StudentProfile.js` set artificial defaults for newly initialized profiles (`cgpa: 7.5`, `graduationYear: 2026`, `university: 'University Institute of Technology'`, `degree: 'B.Tech'`, `branch: 'Computer Science & Engineering'`). These artificially boosted profile completeness to 70% for blank profiles and created phantom academic standing.
3. **Disparate Readiness Calculations:** The student view (`careerIntelligenceController.js`) and the university admin view (`adminController.js`) used divergent calculation logic.
4. **Static AI Fallback Scores:** When the AI service was unreachable, the fallback logic returned fixed placeholder metrics (`readiness_score: 75.0%`, `gap_percentage: 25.0%`, static missing skill `Docker`).

---

## 2. Hardcoded Values Identified & Remediated

* `frontend/src/pages/student/StudentDashboard.jsx`:
  * Removed hardcoded `readiness_score: 85.7`.
  * Removed hardcoded `extractedSkills` array.
  * Replaced initial static gap data with real backend API queries (`api.getCareerReadiness(targetRole)` and `api.getSkillGapAnalysis({ targetRole })`).
  * Added dynamic loading and zero/empty state indicators.
* `backend/src/models/StudentProfile.js`:
  * `cgpa`: Default changed from `7.5` to `null`.
  * `graduationYear`: Default changed from `2026` to `null`.
  * `university`: Default changed from `'University Institute of Technology'` to `''`.
  * `degree`: Default changed from `'B.Tech'` to `''`.
  * `branch`: Default changed from `'Computer Science & Engineering'` to `''`.
  * `careerGoal`: Default changed from `'Full Stack Developer'` to `''`.
* `backend/src/controllers/careerIntelligenceController.js`:
  * Replaced static fallback (`readiness_score: 75.0, missing_critical_skills: ['Docker']`) with authoritative deterministic evaluation matching real student skills against the target role benchmark.

---

## 3. Authoritative Career Readiness Engine

Consolidated all readiness calculations into [`backend/src/utils/readinessCalculator.js`](file:///c:/Users/Lenovo/Desktop/Djano/backend/src/utils/readinessCalculator.js):

$$\text{Readiness Score} = \text{Skill Coverage (50\%)} + \text{Practical Evidence (30\%)} + \text{Academic Completeness (20\%)}$$

1. **Skill Coverage (max 50 pts):**
   $$\text{Score} = \left(\frac{\text{Matched Benchmark Competencies}}{\text{Total Benchmark Competencies}}\right) \times 50.0$$
   *(If student has 0 skills, score is strictly 0.0)*
2. **Practical Evidence (max 30 pts):**
   $$\text{Score} = \min(20.0, \text{Projects} \times 5.0) + \min(10.0, \text{Experience} \times 5.0)$$
3. **Academic Completeness (max 20 pts):**
   $$\text{Score} = \left(\frac{\text{Profile Completeness}}{100.0} \times 10.0\right) + \text{CGPA points}$$
   *(CGPA >= 7.0: 10 pts; CGPA >= 6.0: 6 pts; CGPA < 6.0 or null: 0 pts)*

Both student self-service (`careerIntelligenceController.js`) and university admin reporting (`adminController.js`) now invoke this single authoritative engine.

---

## 4. Git State & Working-Tree Investigation

* **Branch:** `feat/day-4-career-intelligence`
* **Root:** `C:/Users/Lenovo/Desktop/Djano`
* **Worktrees:** Single active worktree at repository root (`481c307 [feat/day-4-career-intelligence]`).
* **Explicit Working-Tree Classification:**
  * **Staged Files:** None (`git diff --cached` is empty).
  * **Modified Tracked Files (37 files):** Changes preserved unstaged in working directory across backend controllers, models, routes, test suites, and frontend components.
  * **Untracked Files:** Security test suites (`security_*_suite.js`), technical audit documentation (`docs/SECURITY_FIX_*.md`), scripts, and auxiliary assets.
  * **Committed Files:** No new commits made; HEAD remains cleanly parked on `481c307`.

---

## 5. Verified Skill Provenance Policy (Prompt 8.1 Audit)

An explicit 4-part provenance policy is enforced in `backend/src/controllers/studentController.js`:
1. **Unchanged Trusted Skill:** Authentic provenance (`assessment_verified` or `resume_extracted`) is preserved **only if** both the canonical skill name AND the skill level remain completely unchanged.
2. **Modified Level on Verified Skill:** Changing the level of a verified skill (e.g., from `intermediate` to `advanced`) strictly downgrades `source` to `'self_reported'` and clears `verifiedAt`. Re-verifying a higher level requires re-assessment or official resume re-synchronization.
3. **Modified Skill Name / New Skill:** Any newly introduced or renamed skill is strictly labeled `source: 'self_reported'`.
4. **Re-addition of Deleted Skill:** Removing a skill and later re-adding it treats it as a new self-service entry (`self_reported`) unless re-synchronized through the authenticated resume pipeline.
5. **Client-Supplied Bypass Immunity:** Incoming payload properties `source` and `verifiedAt` are rejected and discarded; students cannot self-assert provenance.

---

## 6. Python Fallback Test Coverage (`ai-service/tests/test_fallback_integrity.py`)

Dedicated unit test suite covers 6 deterministic fallback guarantees:
* Empty profiles yield `sufficient_data=False` and `0.0` readiness score.
* Genuine skills directly modulate competency coverage.
* Missing skills are dynamically computed against requested role benchmarks without static presets.
* No static `75.0%` or `85.7%` scores are ever returned.
* Job skill gaps are strictly input-dependent.
* All scores remain bounded between `0.0` and `100.0`.

---

## 5. Automated Verification Results

Dedicated Suite: [`backend/tests/security_dashboard_data_integrity_suite.js`](file:///c:/Users/Lenovo/Desktop/Djano/backend/tests/security_dashboard_data_integrity_suite.js) (21/21 Passed).

Comprehensive Monorepo Regression (All 15 Suites):
1. `backend/tests/security_dashboard_data_integrity_suite.js` (21/21)
2. `backend/tests/security_profile_mass_assignment_suite.js` (21/21)
3. `backend/tests/security_database_reliability_suite.js` (17/17)
4. `backend/tests/security_ai_service_auth_suite.js` (20/20)
5. `backend/tests/security_company_verification_suite.js` (21/21)
6. `backend/tests/security_recruiter_ownership_suite.js` (17/17)
7. `backend/tests/security_admin_privilege_suite.js` (13/13)
8. `backend/tests/security_jwt_suite.js` (15/15)
9. `backend/tests/auth_ownership_suite.js` (12/12)
10. `backend/tests/regression_suite.js` (6/6)
11. `backend/tests/day3_suite.js` (16/16)
12. `backend/tests/day4_career_suite.js` (18/18)
13. `backend/tests/day5_admin_suite.js` (19/19)
14. `backend/tests/day5_notification_suite.js` (18/18)
15. `backend/tests/day6_internship_suite.js` (18/18)

**Total Backend Tests: 252/252 Passing.**  
Python AI Test Suite (`ai-service/tests/test_service_auth.py`): **17/17 Passing.**  
**Grand Total: 269/269 Passing.**

# FRONTEND AUTHENTICATION SECURITY AUDIT

**Project:** SkillBridge AI (SIH Problem Statement: SIH26044)  
**Date:** 2026-11-18  
**Classification:** `[FIXED]`, `[TESTED]`

---

## 1. Initial State & Vulnerabilities Identified

1. **Tokens in `localStorage`:**
   - Previous implementation stored raw JWT access tokens in `localStorage.setItem('token', authToken)`.
   - Any client-side XSS vulnerability could read and exfiltrate credentials immediately via `localStorage.getItem('token')`.
2. **Exposed AI Microservice URL:**
   - Frontend `api.js` contained direct references to `AI_BASE_URL` (`http://localhost:8000`).
3. **No Centralized CSRF Defense:**
   - Ambient cookies lacked anti-CSRF double-submit tokens.
4. **Uncoordinated 401 Expiration:**
   - Token expiration was determined client-side via manual base64 decoding (`atob()`) rather than verified server-side session checks.

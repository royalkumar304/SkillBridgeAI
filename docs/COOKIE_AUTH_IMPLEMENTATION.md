# COOKIE AUTHENTICATION IMPLEMENTATION

**Project:** SkillBridge AI (SIH Problem Statement: SIH26044)  
**Date:** 2026-11-18  
**Classification:** `[FIXED]`, `[TESTED]`

---

## 1. Cookie Configuration Architecture

HttpOnly authentication cookies are delivered via `skillbridge_token`:
```javascript
{
  httpOnly: true, // Inaccessible to JavaScript; immune to direct XSS token exfiltration
  secure: process.env.NODE_ENV === 'production', // True only on HTTPS production
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Browser CSRF restriction
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}
```

## 2. Server-Side Extraction (`authMiddleware.js`)
Extracts credentials in priority order:
1. Primary: HttpOnly cookie `req.cookies.skillbridge_token`.
2. Fallback: `Authorization: Bearer <token>` for non-browser clients and automated integration test runners.

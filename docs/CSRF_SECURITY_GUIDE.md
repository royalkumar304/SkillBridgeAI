# Centralized CSRF Protection & Architectural Security Guide

## 1. Overview & Threat Model

SkillBridge AI implements a **Signed Double-Submit Cookie CSRF Defense** with full cryptographic key separation.
This architectural defense guarantees that web browsers operating with ambient credentials (`skillbridge_token` HttpOnly cookie) cannot be coerced into executing forged, unauthorized state-changing operations (cross-site request forgery).

---

## 2. Cryptographic Key Separation

### Problem Statement
In naive double-submit implementations, developers frequently reuse the primary `JWT_SECRET` for signing CSRF tokens or omit signatures entirely. If an application shares an apex domain with subdomains, attackers controlling a subdomain can inject arbitrary cookies (`Set-Cookie: XSRF-TOKEN=forged; Domain=domain.com`), allowing trivial CSRF bypasses.

### SkillBridge AI Solution
1. **Dedicated Secret (`CSRF_SIGNING_SECRET`):** A minimum 256-bit (32 character) secret completely isolated from `JWT_SECRET`.
2. **Production Fail-Fast Enforcement:**
   - In production (`NODE_ENV === 'production'`), if `CSRF_SIGNING_SECRET` is missing or fewer than 32 characters, the backend immediately throws a fatal exception on startup and refuses to launch.
3. **Local Development Subkey Derivation:**
   - In development/testing environments only, if an explicit `CSRF_SIGNING_SECRET` is not declared, the backend derives a segregated subkey from `JWT_SECRET` using HMAC-SHA256 with an isolated salt (`SkillBridge-AI-Dedicated-CSRF-Key-Derivation-Salt`).

---

## 3. Signed Double-Submit Token Format

Every issued CSRF token follows an authenticated two-part structure:
```
<nonce>.<hmacSignature>
```
- **Nonce:** A 32-byte cryptographically secure pseudorandom hex string generated via `crypto.randomBytes(32).toString('hex')`.
- **HMAC Signature:** Calculated as `crypto.createHmac('sha256', CSRF_SIGNING_SECRET).update(nonce).digest('hex')`.

### Verification Logic
Upon receiving a state-changing HTTP request (`POST`, `PUT`, `PATCH`, `DELETE`):
1. **Extraction:**
   - Cookie Token: Extracted from `req.cookies['XSRF-TOKEN']`.
   - Header Token: Extracted from `req.headers['x-csrf-token']` or `req.headers['x-xsrf-token']`.
2. **Signature Verification:**
   - The server verifies that both the cookie token and header token carry valid HMAC-SHA256 signatures produced by the authentic `CSRF_SIGNING_SECRET`.
   - **Subdomain Injection Immunity:** Even if an attacker injects a custom `XSRF-TOKEN` cookie via a compromised sibling subdomain, they cannot compute the HMAC signature without the server's private `CSRF_SIGNING_SECRET`.
3. **Double-Submit Equality:**
   - The token from the cookie and the token from the header are verified to match byte-for-byte using `crypto.timingSafeEqual()`, eliminating side-channel timing leaks.

---

## 4. Request Boundaries & Interoperability

| Request Type | State-Changing? | Authentication Mechanism | CSRF Enforced? | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **GET, HEAD, OPTIONS** | No (Safe) | Cookie or Bearer | **Exempt** | Idempotent, safe HTTP methods cannot alter server state. |
| **POST /auth/login, register** | Yes | None / Public | **Exempt** | Public unauthenticated entry points. |
| **POST, PUT, DELETE** | Yes | HttpOnly Cookie | **STRICTLY ENFORCED** | Ambient browser credentials are automatically transmitted; CSRF required. |
| **POST, PUT, DELETE** | Yes | Authorization: Bearer | **Exempt** | Non-browser clients (CLI, automation, mobile apps) attach explicit headers not subject to browser ambient injection. |

---

## 5. Cookie Attributes & CORS

- **Cookie Name:** `XSRF-TOKEN`
- **HttpOnly:** `false` (Must be readable by frontend JavaScript to attach to the request header)
- **SameSite:** `lax` in development, `strict` in production
- **Path:** `/`
- **MaxAge:** 24 hours
- **CORS Allowlist:** Restricted to explicit origin `http://localhost:5173` with `credentials: true`.

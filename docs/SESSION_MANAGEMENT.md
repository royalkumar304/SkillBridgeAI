# Session Management, Token Versioning & Global Revocation Architecture

## 1. Executive Summary

SkillBridge AI enforces a hybrid **Stateless JWT + Authoritative Database Session Verification** model that delivers the scalability of stateless JWTs with the immediate, fail-closed revocation guarantees of stateful session management.

---

## 2. Token Versioning Data Model

The `User` MongoDB schema includes an atomic `tokenVersion` counter:
```javascript
const userSchema = new mongoose.Schema({
  // ...
  tokenVersion: {
    type: Number,
    default: 0,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'PENDING'],
    default: 'ACTIVE',
  },
});
```

### Semantics
- **Storage Scope:** `tokenVersion` is stored **per user account** in MongoDB (`users.tokenVersion`), rather than in a separate ephemeral session store.
- **Embedded in Token:** When a JWT is signed at `/auth/login` or `/auth/register`, the user's current `tokenVersion` integer is embedded in the signed JWT payload.

---

## 3. Strict Fail-Closed Validation Policy

On every protected request, `backend/src/middleware/authMiddleware.js` enforces the following multi-layer security checks:

1. **Cryptographic Integrity & Payload Inspection:**
   - Verifies JWT signature against `JWT_SECRET` with explicit algorithms (`HS256`), issuer (`skillbridge-ai`), and audience (`skillbridge-users`).
   - Rejects missing `tokenVersion` with HTTP 401.
   - Rejects `null` `tokenVersion` with HTTP 401.
   - Rejects non-number / string `tokenVersion` with HTTP 401.
   - Rejects negative `tokenVersion` (< 0) with HTTP 401.
2. **Authoritative Account Verification:**
   - Queries `User.findById(decoded.id, 'tokenVersion status')`.
   - Rejects non-existent or deleted users with HTTP 401 (`EINVALIDUSER`).
   - Rejects accounts with `status !== 'ACTIVE'` (e.g. `SUSPENDED`) with HTTP 401 (`EACCOUNTDISABLED`).
3. **Session Revocation Match:**
   - Verifies `currentUser.tokenVersion === decoded.tokenVersion`.
   - If values differ, returns HTTP 401 (`EREVOKEDSESSION`), immediately blocking the request.
4. **Database Fail-Closed Guarantee:**
   - If MongoDB is unreachable, unresponsive, or throws an error during the session check, the middleware catches the exception and returns **HTTP 503 Service Unavailable**.
   - Under no circumstances does the system fall back to optimistic stateless authentication when the authoritative database check fails.

---

## 4. Global Logout Semantics

### Operation
When a user calls `POST /api/v1/auth/logout`:
1. The server executes an atomic database increment:
   ```javascript
   await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
   ```
2. The server explicitly clears the browser's HttpOnly cookie:
   ```javascript
   res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
   ```

### Multi-Device Impact
- Because `tokenVersion` is tracked on the user document, incrementing it immediately invalidates **all** active tokens issued to that user across all browsers, mobile devices, and active tabs simultaneously.
- **User Isolation:** Incrementing User A's `tokenVersion` has zero effect on User B's session. User B continues operating without interruption.

---

## 5. Scaling & Enterprise Architecture

| Dimension | Single-Node (Current) | Multi-Node Cluster (Production) |
| :--- | :--- | :--- |
| **Session State** | MongoDB `users` collection | MongoDB primary with secondary reads or optional Redis cache layer |
| **Revocation Latency** | Immediate (< 5ms MongoDB index query) | Immediate (via DB query or distributed Redis publish/subscribe) |
| **Clustering Readiness** | Fully supported (stateless Node.js workers share MongoDB) | Fully supported behind reverse proxy / load balancer |
| **High-Volume Caching** | Direct DB lookup | Optional: Redis caching layer for `tokenVersion` with 60s TTL + pub/sub invalidation |

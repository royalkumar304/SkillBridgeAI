# University Admin Account Provisioning Guide

## Overview

SkillBridge AI implements Role-Based Access Control (RBAC) with three distinct user roles:
1. `STUDENT` &mdash; Public registration
2. `RECRUITER` &mdash; Public registration (subject to verification)
3. `UNIVERSITY_ADMIN` &mdash; **Out-of-band provisioning only**

### Security Model & Rationale
To ensure institutional integrity and prevent privilege escalation:
- The public signup interface and `POST /api/v1/auth/register` explicitly restrict registration to `STUDENT` and `RECRUITER`.
- Any public registration payload attempting to pass `role: "UNIVERSITY_ADMIN"` or `role: "ADMIN"` is blocked immediately with HTTP 400 (`Direct registration for administrative roles is prohibited`).
- Initial administrative access is provisioned securely out-of-band via the server-side CLI utility `backend/scripts/provisionAdmin.js`.

---

## Provisioning CLI: `backend/scripts/provisionAdmin.js`

The provisioning script interacts directly with the database using Mongoose and the core `User` model to:
1. Validate required administrator attributes (Name, Email, Password, University).
2. Validate email format and enforce strong password policies ($\ge 8$ characters).
3. Check for existing accounts with that email to prevent duplicate accounts or accidental role overwrites.
4. Hash the password using the application's standard bcrypt implementation (`User.hashPassword`).
5. Provision the account with `role: "UNIVERSITY_ADMIN"`, `status: "ACTIVE"`, `isVerified: true`, and initialized security `tokenVersion`.

---

## Provisioning Instructions (Windows PowerShell)

Run these commands from the project root (`C:\Users\Lenovo\Desktop\Djano`) or the `backend/` directory.

### Method A: Environment Variables (Non-Interactive / Automation)

Set the required environment variables in your current PowerShell session and execute the script:

```powershell
# Set Admin Configuration
$env:ADMIN_NAME="Dr. Eleanor Vance"
$env:ADMIN_EMAIL="admin@university.edu"
$env:ADMIN_PASSWORD="YourStrongAdminPassword2026!"
$env:ADMIN_UNIVERSITY="State Technological University"

# Optional: Override MongoDB URI if not using .env
# $env:MONGO_URI="mongodb://127.0.0.1:27017/skillbridge_ai"

# Execute Provisioning Script
node backend/scripts/provisionAdmin.js
```

**Expected Success Output:**
```text
============================================================
SkillBridge AI - University Admin Provisioning Tool
============================================================
Connecting to MongoDB...
Connected to MongoDB.
Validating configuration...
Configuration valid. Creating UNIVERSITY_ADMIN account...

[SUCCESS] University Admin created successfully!
  User ID:    67...
  Name:       Dr. Eleanor Vance
  Email:      admin@university.edu
  Role:       UNIVERSITY_ADMIN
  University: State Technological University
  Status:     ACTIVE
  Verified:   true
============================================================
```

### Method B: Interactive Mode (Masked Input)

If environment variables are omitted, the script prompts for missing fields in the terminal, masking password input:

```powershell
node backend/scripts/provisionAdmin.js
```

---

## How to Sign In

### 1. Via Frontend UI
1. Start or visit the SkillBridge AI web interface (`http://localhost:5173/login`).
2. Enter the provisioned email (`admin@university.edu`) and password.
3. Upon successful authentication, the backend issues an HttpOnly, secure `skillbridge_token` JWT cookie.
4. The frontend routes the authenticated administrator to the University Admin Dashboard (`/admin/dashboard`).

### 2. Via API / Curl / PowerShell
```powershell
# Authenticate via API
$body = @{
    email = "admin@university.edu"
    password = "YourStrongAdminPassword2026!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:5001/api/v1/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -SessionVariable adminSession

Write-Output "User Role: $($response.data.user.role)"
```

---

## Verifying University Admin Dashboard Access

University Admin routes are mounted under `/api/v1/admin/` and protected by `authenticateToken` and `requireRole('UNIVERSITY_ADMIN')`.

Verify access to administrative endpoints:

```powershell
# Query Admin Overview Stats
Invoke-RestMethod -Uri "http://127.0.0.1:5001/api/v1/admin/stats" `
    -Method Get `
    -WebSession $adminSession
```

```powershell
# Query Student Roster
Invoke-RestMethod -Uri "http://127.0.0.1:5001/api/v1/admin/students" `
    -Method Get `
    -WebSession $adminSession
```

Non-administrative accounts (`STUDENT`, `RECRUITER`) or unauthenticated requests attempting to access these routes receive `403 Forbidden` (`Access denied. Required role: UNIVERSITY_ADMIN`).

---

## Duplicate Protection & Error Handling

- **Duplicate Email:**
  If an account already exists with the given email, the script halts with exit code 1:
  ```text
  [ERROR] Account already exists with email: admin@university.edu (Role: UNIVERSITY_ADMIN). Duplicate admin creation rejected.
  ```
- **Weak Password:**
  Passwords shorter than 8 characters are rejected immediately:
  ```text
  [ERROR] ADMIN_PASSWORD must be at least 8 characters long.
  ```
- **Database Connection Failure:**
  Ensure MongoDB is running locally on port 27017 or provide `MONGO_URI` pointing to your cluster.

---

## Troubleshooting & Account Recovery

If the administrator password is forgotten or needs reset:
1. Ensure access to the MongoDB database host.
2. If another admin exists, they can manage administrative roles, or rerun a recovery script directly on the database host to rotate credentials.
3. To replace a corrupted test account in development, remove the test user document from the `users` collection via MongoDB shell or Compass before re-running the provisioning script.

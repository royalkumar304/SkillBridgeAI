# SkillBridge AI — Comprehensive Local Setup & Operations Guide
**SIH Problem Statement:** SIH26044 | **Target Audience:** Developers, Evaluators, Evaluators, Judges

This guide walks through configuring and running the SkillBridge AI platform on a clean machine.

---

## 1. System Requirements & Port Allocation

| Component | Default Port | Environment Variable | Technology |
| :--- | :---: | :--- | :--- |
| **Frontend** | `5173` | `VITE_API_BASE_URL=http://localhost:5001/api/v1` | React 19 + Vite |
| **Backend REST API** | `5001` | `PORT=5001` | Express / Node.js |
| **AI Microservice** | `8000` | `PORT=8000` | FastAPI / Python 3.12 |
| **Database** | `27017` | `MONGO_URI=mongodb://127.0.0.1:27017/skillbridge_ai`| MongoDB Community |

*Note: Port 5001 is deliberately selected for the Node backend on Windows to eliminate collisions with Microsoft HelpWire services occupying port 5000.*

---

## 2. Step-by-Step Installation

### Step A: Database Initialization
Ensure MongoDB is running locally:
```powershell
mongod --dbpath "C:\data\db"
# Or verify MongoDB service is running
Get-Service MongoDB
```

### Step B: Python AI Microservice Setup
From repository root:
```powershell
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start AI Service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Health Check:* Open `http://localhost:8000/health` in your browser. Expected response: `{"status": "ok", "service": "skillbridge-ai"}`.

### Step C: Node.js Backend API Setup
In a new terminal window:
```powershell
cd backend

# Install dependencies
npm install

# Start in development mode with hot reload
npm run dev
```
*Health Check:* Open `http://localhost:5001/api/v1/health`. Expected response: `{"success": true, "data": { "service": "SkillBridge Backend API", "status": "UP" }}`.

### Step D: Frontend Client Setup
In a third terminal window:
```powershell
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev -- --host 127.0.0.1
```
*Access UI:* Open `http://localhost:5173` in your browser.

### Step E: Secure Administrator Provisioning (CLI-Only)
For security against privilege escalation, public registration accepts only `STUDENT` and `RECRUITER` roles.
To create a `UNIVERSITY_ADMIN` account, run the CLI provisioning script locally:
```powershell
# Interactive hidden password prompt:
node backend/scripts/provisionAdmin.js

# Or via environment variables:
$env:ADMIN_EMAIL="admin@univ.edu"; $env:ADMIN_PASSWORD="SecurePassword@123"; $env:ADMIN_NAME="Dean S. K. Verma"; node backend/scripts/provisionAdmin.js
```
The script hashes the password using `bcryptjs` and inserts the administrator record with role `UNIVERSITY_ADMIN` directly into MongoDB.

---

## 3. Running Verification & Regression Suites

Run all 8 test suites to verify that the local environment is fully operational:
```powershell
node backend/tests/regression_suite.js
node backend/tests/day3_suite.js
node backend/tests/auth_ownership_suite.js
node backend/tests/day4_career_suite.js
node backend/tests/day5_admin_suite.js
node backend/tests/day5_notification_suite.js
node backend/tests/day6_internship_suite.js
node backend/tests/test_pdf_upload.js
```

Verify frontend production compilation:
```powershell
cd frontend
npm run build
```

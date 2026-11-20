# SkillBridge AI — API Integration Audit & Contract Matrix
**SIH Problem Statement:** SIH26044 | **Last Verified:** Prompt 4 Final Integration Check

This matrix documents all frontend API calls in `frontend/src/services/api.js` and their corresponding backend routes across Node.js (`http://localhost:5001`) and the Python AI microservice (`http://localhost:8000`).

---

## 1. Authentication & Platform Identity

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/health` | Public | `api.checkBackendHealth` | `healthRoutes.js` | **VERIFIED** |
| `POST` | `/api/v1/auth/register` | Public | `api.register` | `authController.register` | **VERIFIED** |
| `POST` | `/api/v1/auth/login` | Public | `api.login` | `authController.login` | **VERIFIED** |
| `GET` | `/api/v1/auth/me` | Authenticated | `api.getProfile` | `authController.getMe` | **VERIFIED** |

---

## 2. Student Profile & Resume Synchronization

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/students/profile` | `STUDENT` | `api.getStudentProfile` | `studentController.getProfile` | **VERIFIED** |
| `PUT` | `/api/v1/students/profile` | `STUDENT` | `api.updateStudentProfile` | `studentController.updateProfile` | **VERIFIED** |
| `GET` | `/api/v1/students/profile/completion` | `STUDENT` | `api.getProfileCompletion` | `studentController.getProfileCompletion` | **VERIFIED** |
| `POST` | `/api/v1/students/profile/sync-resume-skills` | `STUDENT` | `api.syncResumeSkills` | `studentController.syncResumeSkills` | **VERIFIED** |

---

## 3. Opportunities & Applications (Jobs & Internships)

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/jobs` | Optional Auth | `api.getJobs` | `jobController.getJobs` | **VERIFIED** |
| `GET` | `/api/v1/jobs/:id` | Public | `api.getJobById` | `jobController.getJobById` | **VERIFIED** |
| `GET` | `/api/v1/jobs/:id/match` | `STUDENT` | `api.getJobMatch` | `jobController.getJobMatch` | **VERIFIED** |
| `POST` | `/api/v1/jobs` | `RECRUITER` | `api.createJob` | `jobController.createJob` | **VERIFIED** |
| `PUT` | `/api/v1/jobs/:id` | `RECRUITER` | `api.updateJob` | `jobController.updateJob` | **VERIFIED** |
| `PATCH` | `/api/v1/jobs/:id/status` | `RECRUITER` | `api.updateJobStatus` | `jobController.updateJobStatus` | **VERIFIED** |
| `DELETE` | `/api/v1/jobs/:id` | `RECRUITER` | `api.deleteJob` | `jobController.deleteJob` | **VERIFIED** |
| `POST` | `/api/v1/applications` | `STUDENT` | `api.applyToJob` | `applicationController.createApplication` | **VERIFIED** |
| `GET` | `/api/v1/applications/my` | `STUDENT` | `api.getMyApplications` | `applicationController.getMyApplications` | **VERIFIED** |
| `GET` | `/api/v1/jobs/:id/applications`| `RECRUITER` | `api.getJobApplications` | `applicationController.getJobApplications`| **VERIFIED** |
| `PATCH` | `/api/v1/applications/:id/status`| `RECRUITER` | `api.updateApplicationStatus` | `applicationController.updateApplicationStatus` | **VERIFIED** |

---

## 4. AI Career Intelligence

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/career/readiness` | `STUDENT` | `api.getCareerReadiness` | `careerIntelligenceController.getCareerReadiness` | **VERIFIED** |
| `GET` | `/api/v1/career/gap-analysis` | `STUDENT` | `api.getSkillGapAnalysis` | `careerIntelligenceController.getSkillGapAnalysis` | **VERIFIED** |
| `GET` | `/api/v1/career/recommendations` | `STUDENT` | `api.getLearningRecommendations` | `careerIntelligenceController.getLearningRecommendations` | **VERIFIED** |
| `GET` | `/api/v1/career/jobs-analysis` | `STUDENT` | `api.getJobWiseAnalysis` | `careerIntelligenceController.getJobWiseAnalysis` | **VERIFIED** |

---

## 5. University Administration & Governance

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/admin/stats` | `UNIVERSITY_ADMIN` | `api.getAdminStats` | `adminController.getAdminStats` | **VERIFIED** |
| `GET` | `/api/v1/admin/students` | `UNIVERSITY_ADMIN` | `api.getAdminStudents` | `adminController.getAdminStudents` | **VERIFIED** |
| `GET` | `/api/v1/admin/companies` | `UNIVERSITY_ADMIN` | `api.getAdminCompanies` | `adminController.getAdminCompanies` | **VERIFIED** |
| `PATCH` | `/api/v1/admin/companies/:id/verify` | `UNIVERSITY_ADMIN` | `api.verifyCompany` | `adminController.verifyCompany` | **VERIFIED** |
| `GET` | `/api/v1/admin/curriculum-gap` | `UNIVERSITY_ADMIN` | `api.getCurriculumGap` | `adminController.getCurriculumGap` | **VERIFIED** |
| `GET` | `/api/v1/admin/industry-skill-demand` | `UNIVERSITY_ADMIN` | `api.getIndustrySkillDemand`| `adminController.getIndustrySkillDemand` | **VERIFIED** |
| `GET` | `/api/v1/admin/industry-partners` | `UNIVERSITY_ADMIN` | `api.getIndustryPartners` | `adminController.getIndustryPartners` | **VERIFIED** |
| `GET` | `/api/v1/admin/internships` | `UNIVERSITY_ADMIN` | `api.getAdminInternships`| `adminController.getAdminInternships` | **VERIFIED** |

---

## 6. Corporate Accreditation & Company Profile

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/companies/profile` | `RECRUITER` | `api.getMyCompanyProfile` | `companyController.getMyCompanyProfile` | **VERIFIED** |
| `PUT` | `/api/v1/companies/profile` | `RECRUITER` | `api.updateMyCompanyProfile` | `companyController.updateMyCompanyProfile` | **VERIFIED** |
| `GET` | `/api/v1/companies/:id` | Public / Auth | `api.getCompanyById` | `companyController.getCompanyById` | **VERIFIED** |

---

## 7. In-App Notification Center

| Method | Endpoint | Role Required | Frontend Caller | Backend Controller / Handler | Status |
| :---: | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/notifications` | Authenticated | `api.getNotifications` | `notificationController.getNotifications` | **VERIFIED** |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | `api.getUnreadCount` | `notificationController.getUnreadCount` | **VERIFIED** |
| `PATCH` | `/api/v1/notifications/:id/read` | Authenticated | `api.markNotificationAsRead`| `notificationController.markAsRead` | **VERIFIED** |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | `api.markAllNotificationsAsRead` | `notificationController.markAllAsRead` | **VERIFIED** |
| `DELETE` | `/api/v1/notifications/:id` | Authenticated | `api.deleteNotification` | `notificationController.deleteNotification` | **VERIFIED** |

---

## 8. AI Microservice Direct Endpoints (Port 8000)

| Method | Endpoint | Auth | Purpose | Status |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/health` | None | AI Service Health Check | **VERIFIED** |
| `POST` | `/extract-skills` | Form / Multipart | PyMuPDF text & skill extraction from PDF resume | **VERIFIED** |
| `POST` | `/match-jobs` | JSON | Deterministic weighted skill match calculation | **VERIFIED** |
| `POST` | `/analyze-skill-gap` | JSON | Multimodal skill gap breakdown & learning priorities | **VERIFIED** |

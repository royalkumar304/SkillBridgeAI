import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Portal Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import EditProfile from './pages/student/EditProfile';
import JobBoard from './pages/student/JobBoard';
import JobDetails from './pages/student/JobDetails';
import InternshipBoard from './pages/student/InternshipBoard';
import MyApplications from './pages/student/MyApplications';
import CareerReadiness from './pages/student/CareerReadiness';
import SkillGapAnalysis from './pages/student/SkillGapAnalysis';
import LearningRecommendations from './pages/student/LearningRecommendations';
import JobWiseAnalysis from './pages/student/JobWiseAnalysis';

// Recruiter Portal Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import ManageJobs from './pages/recruiter/ManageJobs';
import ManageInternships from './pages/recruiter/ManageInternships';
import CreateJob from './pages/recruiter/CreateJob';
import EditJob from './pages/recruiter/EditJob';
import JobApplicants from './pages/recruiter/JobApplicants';
import CompanyProfile from './pages/recruiter/CompanyProfile';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentRoster from './pages/admin/StudentRoster';
import CompanyApprovals from './pages/admin/CompanyApprovals';
import CurriculumInsights from './pages/admin/CurriculumInsights';
import IndustryPartners from './pages/admin/IndustryPartners';

// Shared Authenticated Pages
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Role-Protected Portals */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile/edit"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <JobBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/internships"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <InternshipBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/career/readiness"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <CareerReadiness />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/career/gap"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <SkillGapAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/career/recommendations"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <LearningRecommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/career/jobs"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <JobWiseAnalysis />
              </ProtectedRoute>
            }
          />

          {/* Recruiter Role-Protected Portals */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <ManageJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/internships"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <ManageInternships />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/profile"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/create"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CreateJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <EditJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id/applications"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <JobApplicants />
              </ProtectedRoute>
            }
          />

          {/* Admin Role-Protected Portal */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN']}>
                <StudentRoster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN']}>
                <CompanyApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/partners"
            element={
              <ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN']}>
                <IndustryPartners />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/curriculum-insights"
            element={
              <ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN']}>
                <CurriculumInsights />
              </ProtectedRoute>
            }
          />

          {/* Shared Authenticated Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'RECRUITER', 'UNIVERSITY_ADMIN']}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

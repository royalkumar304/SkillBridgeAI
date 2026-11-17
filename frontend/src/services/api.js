/**
 * SkillBridge AI Frontend API Client (Updated for Day 2)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Backend Auth & Health
  checkBackendHealth: async () => {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.json();
  },

  register: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  login: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // AI Microservice (Port 8000)
  checkAiHealth: async () => {
    const res = await fetch(`${AI_BASE_URL}/health`);
    return res.json();
  },

  extractSkills: async (text) => {
    const res = await fetch(`${AI_BASE_URL}/extract-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  uploadResumePdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${AI_BASE_URL}/upload-resume-pdf`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  matchJobs: async (payload) => {
    const res = await fetch(`${AI_BASE_URL}/match-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  analyzeGap: async (targetRole, acquiredSkills) => {
    const res = await fetch(`${AI_BASE_URL}/analyze-skill-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_role: targetRole,
        acquired_skills: acquiredSkills,
      }),
    });
    return res.json();
  },

  // ── Student Profile ──────────────────────────────────────────────────────
  getStudentProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/students/profile`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  updateStudentProfile: async (data) => {
    const res = await fetch(`${API_BASE_URL}/students/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getProfileCompletion: async () => {
    const res = await fetch(`${API_BASE_URL}/students/profile/completion`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ── Jobs ─────────────────────────────────────────────────────────────────
  getJobs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.skills) params.set('skills', filters.skills);
    if (filters.location) params.set('location', filters.location);
    if (filters.jobType) params.set('jobType', filters.jobType);
    if (filters.search) params.set('search', filters.search);
    if (filters.myJobs) params.set('myJobs', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/jobs${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getJobById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getJobMatch: async (id) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}/match`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  createJob: async (data) => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateJob: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateJobStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  deleteJob: async (id) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ── Applications ─────────────────────────────────────────────────────────
  applyToJob: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ jobId }),
    });
    // return both json and status so callers can detect 409
    const data = await res.json();
    return { ...data, _status: res.status };
  },

  getMyApplications: async () => {
    const res = await fetch(`${API_BASE_URL}/applications/my`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getJobApplications: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/applications`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  updateApplicationStatus: async (appId, status) => {
    const res = await fetch(`${API_BASE_URL}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // ── Career Intelligence (Day 4) ──────────────────────────────────────────
  getCareerReadiness: async (targetRole) => {
    const query = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    const res = await fetch(`${API_BASE_URL}/career/readiness${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getSkillGapAnalysis: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.jobId) searchParams.set('jobId', params.jobId);
    if (params.targetRole) searchParams.set('targetRole', params.targetRole);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/career/gap-analysis${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getLearningRecommendations: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.jobId) searchParams.set('jobId', params.jobId);
    if (params.targetRole) searchParams.set('targetRole', params.targetRole);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/career/recommendations${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getJobWiseAnalysis: async () => {
    const res = await fetch(`${API_BASE_URL}/career/jobs-analysis`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

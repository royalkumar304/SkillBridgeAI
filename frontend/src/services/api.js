/**
 * SkillBridge AI Centralized Frontend API Client
 * Enterprise-grade architecture:
 * - Cookie-based authentication with credentials: 'include'.
 * - Centralized CSRF double-submit token synchronization.
 * - Uniform error handling, HTTP 401 handling, and HTTP 429 backoff.
 * - Zero direct browser-to-AI microservice exposure.
 * - Backward-compatible Bearer header fallback when token is provided.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

let cachedCsrfToken = null;

/**
 * Reads CSRF token from document.cookie (XSRF-TOKEN)
 */
const getCookieCsrfToken = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

/**
 * Fetches or initializes CSRF token from backend
 */
const ensureCsrfToken = async () => {
  const cookieToken = getCookieCsrfToken();
  if (cookieToken) {
    cachedCsrfToken = cookieToken;
    return cookieToken;
  }
  if (!cachedCsrfToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.csrfToken) {
        cachedCsrfToken = data.csrfToken;
      }
    } catch (e) {
      // Best-effort in non-browser or offline contexts
    }
  }
  return cachedCsrfToken || getCookieCsrfToken();
};

/**
 * Core centralized request wrapper
 */
const request = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  // Set credentials for HttpOnly cookie authentication
  options.credentials = 'include';

  // Attach CSRF token on state-changing operations
  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (stateChanging) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken && !headers['x-csrf-token'] && !headers['x-xsrf-token']) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  // Attach Content-Type for JSON payloads if not multipart
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  options.headers = headers;

  try {
    const res = await fetch(url, options);

    // Update CSRF token from response headers if present
    const cookieToken = getCookieCsrfToken();
    if (cookieToken) cachedCsrfToken = cookieToken;

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => '');
    }

    if (!res.ok) {
      // 401 Unauthorized handling: notify session expiration without infinite loops
      if (res.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
        // Dispatch session expired event for AuthContext to react
        window.dispatchEvent(new CustomEvent('skillbridge:session_expired'));
      }

      return {
        success: false,
        status: res.status,
        message: data.message || `Request failed with status ${res.status}`,
        error: data.error || 'Request Error',
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      status: 0,
      message: err.message || 'Network error occurred. Please check your connection.',
      error: 'NetworkError',
    };
  }
};

export const api = {
  // ── Authentication & Session ─────────────────────────────────────────────
  checkBackendHealth: () => request('/health'),
  getCsrfToken: () => ensureCsrfToken(),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getProfile: () => request('/auth/me'),

  // ── AI Health (via backend health or direct) ─────────────────────────────
  checkAiHealth: async () => {
    // Queries backend health which checks connectivity
    const res = await request('/health');
    return {
      status: res.success ? 'HEALTHY' : 'DEGRADED',
      ...res,
    };
  },

  // ── Authenticated Resume Management ──────────────────────────────────────
  uploadResumePdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/students/resume', {
      method: 'POST',
      body: formData,
    });
  },

  getMyResumes: () => request('/students/resume'),
  deleteResume: (resumeId) =>
    request(`/students/resume/${resumeId}`, {
      method: 'DELETE',
    }),

  // ── Student Profile ──────────────────────────────────────────────────────
  getStudentProfile: () => request('/students/profile'),
  updateStudentProfile: (payload) =>
    request('/students/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getProfileCompletion: () => request('/students/profile/completion'),

  // ── Job Postings & Match ─────────────────────────────────────────────────
  getJobs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.skills) params.append('skills', filters.skills);
    if (filters.location) params.append('location', filters.location);
    if (filters.jobType) params.append('jobType', filters.jobType);
    if (filters.search) params.append('search', filters.search);
    if (filters.myJobs) params.append('myJobs', 'true');
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/jobs${query}`);
  },

  getJobById: (id) => request(`/jobs/${id}`),
  getJobMatch: (id) => request(`/jobs/${id}/match`),
  createJob: (payload) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateJob: (id, payload) =>
    request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateJobStatus: (id, status) =>
    request(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteJob: (id) =>
    request(`/jobs/${id}`, {
      method: 'DELETE',
    }),

  // ── Applications ─────────────────────────────────────────────────────────
  createApplication: (payload) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyApplications: () => request('/applications/my'),
  getJobApplications: (jobId) => request(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (appId, status) =>
    request(`/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // ── Career Intelligence ──────────────────────────────────────────────────
  getCareerReadiness: (jobId) => {
    const query = jobId ? `?jobId=${jobId}` : '';
    return request(`/career/readiness${query}`);
  },
  getSkillGapAnalysis: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.jobId) qs.append('jobId', params.jobId);
    if (params.targetRole) qs.append('targetRole', params.targetRole);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/career/gap-analysis${query}`);
  },
  getLearningRecommendations: (targetRole) => {
    const query = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    return request(`/career/recommendations${query}`);
  },
  getJobWiseAnalysis: () => request('/career/jobs-analysis'),
  syncResumeSkills: (extractedSkills = []) =>
    request('/students/profile/sync-resume-skills', {
      method: 'POST',
      body: JSON.stringify({ extractedSkills }),
    }),

  // ── University Admin ─────────────────────────────────────────────────────
  getAdminStats: () => request('/admin/stats'),
  getAdminStudents: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.minCGPA) params.append('minCGPA', filters.minCGPA);
    if (filters.maxCGPA) params.append('maxCGPA', filters.maxCGPA);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/students${query}`);
  },
  getAdminCompanies: () => request('/admin/companies'),
  verifyCompany: (companyId, payload) =>
    request(`/admin/companies/${companyId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getCurriculumGap: () => request('/admin/curriculum-gap'),
  getIndustrySkillDemand: () => request('/admin/industry-skill-demand'),
  getIndustryPartners: () => request('/admin/industry-partners'),
  getAdminInternships: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/internships${query}`);
  },

  // ── Notifications ────────────────────────────────────────────────────────
  getNotifications: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.unreadOnly) params.append('unreadOnly', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/notifications${query}`);
  },
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationAsRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsAsRead: () =>
    request('/notifications/read-all', {
      method: 'PATCH',
    }),
  deleteNotification: (id) =>
    request(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  // ── Recruiter Company Profile ────────────────────────────────────────────
  getMyCompanyProfile: () => request('/companies/profile'),
  updateMyCompanyProfile: (payload) =>
    request('/companies/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getCompanyById: (id) => request(`/companies/${id}`),
};

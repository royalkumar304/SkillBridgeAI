/**
 * SkillBridge AI Frontend API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
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

  // AI Microservice (Direct / Bridged)
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
};


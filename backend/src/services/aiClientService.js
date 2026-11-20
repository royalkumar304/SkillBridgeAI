/**
 * Client service to communicate with Python FastAPI AI microservice (port 8000).
 * Authenticates internal requests using X-Internal-Service-Key header.
 */
const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const getInternalHeaders = (extraHeaders = {}) => {
  const serviceKey = process.env.INTERNAL_SERVICE_KEY;
  const headers = {
    ...extraHeaders,
  };
  if (serviceKey) {
    headers['X-Internal-Service-Key'] = serviceKey;
  }
  return headers;
};

class AIClientService {
  static async checkHealth(timeoutMs = 2500) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${AI_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return {
        status: response.ok ? 'HEALTHY' : 'DEGRADED',
        data,
      };
    } catch (error) {
      return {
        status: 'OFFLINE',
        error: error.name === 'AbortError' ? 'AI microservice health check timed out' : 'AI microservice unreachable',
      };
    }
  }

  static async extractSkills(resumeText) {
    try {
      const response = await fetch(`${AI_BASE_URL}/extract-skills`, {
        method: 'POST',
        headers: getInternalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: resumeText }),
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Extract skills failed:', error.message);
      throw error;
    }
  }

  static async uploadResumePdf(fileBuffer, filename = 'resume.pdf') {
    try {
      const boundary = '----SkillBridgeBoundary' + Math.random().toString(36).substring(2);
      const pre = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`;
      const post = `\r\n--${boundary}--\r\n`;

      const preBuf = Buffer.from(pre, 'utf8');
      const postBuf = Buffer.from(post, 'utf8');
      const fullBody = Buffer.concat([preBuf, Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer), postBuf]);

      const response = await fetch(`${AI_BASE_URL}/upload-resume-pdf`, {
        method: 'POST',
        headers: getInternalHeaders({
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        }),
        body: fullBody,
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Upload resume PDF failed:', error.message);
      throw error;
    }
  }

  static async matchJob(studentSkills, jobSkills, studentCgpa, jobMinCgpa) {
    try {
      const response = await fetch(`${AI_BASE_URL}/match-jobs`, {
        method: 'POST',
        headers: getInternalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          student_skills: studentSkills,
          job_required_skills: jobSkills,
          student_cgpa: studentCgpa,
          job_min_cgpa: jobMinCgpa,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Match job failed:', error.message);
      throw error;
    }
  }

  static async analyzeSkillGap(targetRole, acquiredSkills) {
    try {
      const response = await fetch(`${AI_BASE_URL}/analyze-skill-gap`, {
        method: 'POST',
        headers: getInternalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          target_role: targetRole,
          acquired_skills: acquiredSkills,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Analyze skill gap failed:', error.message);
      throw error;
    }
  }

  static async analyzeJobSkillGap(studentSkills, jobRequiredSkills, jobPreferredSkills = []) {
    try {
      const response = await fetch(`${AI_BASE_URL}/career-intelligence/job-gap`, {
        method: 'POST',
        headers: getInternalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          student_skills: studentSkills,
          job_required_skills: jobRequiredSkills,
          job_preferred_skills: jobPreferredSkills,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Analyze job skill gap failed:', error.message);
      throw error;
    }
  }

  static async calculateCareerReadiness(targetRole, studentSkills, studentCgpa, projects, experience, profileCompletePercent) {
    try {
      const response = await fetch(`${AI_BASE_URL}/career-intelligence/readiness`, {
        method: 'POST',
        headers: getInternalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          target_role: targetRole,
          student_skills: studentSkills,
          student_cgpa: studentCgpa,
          projects: projects,
          experience: experience,
          profile_complete_percent: profileCompletePercent,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Calculate career readiness failed:', error.message);
      throw error;
    }
  }
}

module.exports = AIClientService;


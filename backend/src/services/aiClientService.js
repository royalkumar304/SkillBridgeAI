/**
 * Client service to communicate with Python FastAPI AI microservice (port 8000).
 */
const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIClientService {
  static async checkHealth() {
    try {
      const response = await fetch(`${AI_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.warn(`[AIClientService] AI microservice health check failed: ${error.message}`);
      return { status: 'OFFLINE', error: error.message };
    }
  }

  static async extractSkills(resumeText) {
    try {
      const response = await fetch(`${AI_BASE_URL}/extract-skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumeText }),
      });
      return await response.json();
    } catch (error) {
      console.error('[AIClientService] Extract skills failed:', error.message);
      throw error;
    }
  }

  static async matchJob(studentSkills, jobSkills, studentCgpa, jobMinCgpa) {
    try {
      const response = await fetch(`${AI_BASE_URL}/match-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
}

module.exports = AIClientService;


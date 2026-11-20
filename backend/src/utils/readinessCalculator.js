/**
 * Authoritative Career Readiness Scoring Engine
 * 
 * Standard Formula:
 * - 50% Skill Coverage against role benchmark (or target skills)
 * - 30% Practical Evidence (Projects & Verified Experience)
 * - 20% Academic & Profile Completeness (CGPA & required profile fields)
 * 
 * Total Readiness Score: 0 to 100
 */

const ROLE_BENCHMARKS = {
  'Full Stack Developer': ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'REST API', 'Git'],
  'Frontend Developer': ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'TypeScript', 'Git'],
  'Backend Developer': ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
  'Data Scientist': ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'Data Visualization'],
  'AI / ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'Git'],
  'Cloud / DevOps Engineer': ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git'],
  'Software Engineer': ['Data Structures', 'Algorithms', 'Java', 'Python', 'SQL', 'Git'],
};

/**
 * Calculates career readiness deterministically from authenticated profile data.
 * Used identically across student self-service and admin dashboard reporting.
 */
function calculateCareerReadinessAuthoritative(profile, targetRole = 'Full Stack Developer', completionPercent = 0) {
  if (!profile) {
    return {
      sufficientData: false,
      readinessScore: 0,
      targetRole,
      message: 'No student profile found. Please set up your profile to calculate career readiness.',
      breakdown: {
        skillCoverageScore: 0,
        practicalEvidenceScore: 0,
        academicCompletenessScore: 0,
      },
      matchedBenchmarkSkills: [],
      missingBenchmarkSkills: ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Full Stack Developer'],
      improvementAreas: ['Create your technical profile and add skills'],
      profileCompleteness: 0,
      source: 'authoritative_engine',
    };
  }

  const role = targetRole || profile.careerGoal || 'Full Stack Developer';
  const benchmark = ROLE_BENCHMARKS[role] || ROLE_BENCHMARKS['Full Stack Developer'];

  const studentSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const cgpa = typeof profile.cgpa === 'number' ? profile.cgpa : 0;

  const studentSkillNames = new Set(
    studentSkills.filter((s) => s && s.name).map((s) => s.name.trim().toLowerCase())
  );

  // If no skills are provided, score is 0
  if (studentSkillNames.size === 0) {
    return {
      sufficientData: false,
      readinessScore: 0,
      targetRole: role,
      message: 'Please add skills to view your career readiness score.',
      breakdown: {
        skillCoverageScore: 0,
        practicalEvidenceScore: 0,
        academicCompletenessScore: 0,
      },
      matchedBenchmarkSkills: [],
      missingBenchmarkSkills: benchmark,
      improvementAreas: ['Add core skills matching your target career role', 'Add projects to demonstrate skills'],
      profileCompleteness: completionPercent,
      source: 'authoritative_engine',
    };
  }

  // 1. Skill Coverage Score (max 50 points)
  const matched = [];
  const missing = [];
  for (const b of benchmark) {
    if (studentSkillNames.has(b.toLowerCase())) {
      matched.push(b);
    } else {
      missing.push(b);
    }
  }

  const skillCoverageScore = Number(((matched.length / benchmark.length) * 50.0).toFixed(1));

  // 2. Practical Evidence Score (max 30 points)
  // Up to 20 pts from projects (5 pts per project with description/techStack, max 4 projects)
  // Up to 10 pts from experience (5 pts per experience, max 2)
  const projectScore = Math.min(20.0, projects.length * 5.0);
  const expScore = Math.min(10.0, experience.length * 5.0);
  const practicalEvidenceScore = Number((projectScore + expScore).toFixed(1));

  // 3. Academic & Completeness Score (max 20 points)
  // Profile completeness contributes up to 10 points
  // CGPA >= 7.0 contributes 10 points; >= 6.0 contributes 6 points; otherwise 0
  const completenessPts = (completionPercent / 100.0) * 10.0;
  const cgpaPts = cgpa >= 7.0 ? 10.0 : cgpa >= 6.0 ? 6.0 : 0.0;
  const academicCompletenessScore = Number((completenessPts + cgpaPts).toFixed(1));

  let totalScore = Math.round((skillCoverageScore + practicalEvidenceScore + academicCompletenessScore) * 10) / 10;
  totalScore = Math.min(100.0, Math.max(0.0, totalScore));

  const improvementAreas = [];
  if (missing.length > 0) {
    improvementAreas.push(`Learn core benchmark skills: ${missing.slice(0, 3).join(', ')}`);
  }
  if (projects.length < 2) {
    improvementAreas.push('Add at least 2 projects demonstrating practical implementation');
  }
  if (experience.length === 0) {
    improvementAreas.push('Gain practical experience through internships or live projects');
  }
  if (completionPercent < 100) {
    improvementAreas.push('Complete remaining profile details to maximize readiness index');
  }

  return {
    sufficientData: true,
    readinessScore: totalScore,
    targetRole: role,
    message: `Evaluated based on ${matched.length}/${benchmark.length} benchmark skills, ${projects.length} projects, and ${experience.length} experiences.`,
    breakdown: {
      skillCoverageScore,
      practicalEvidenceScore,
      academicCompletenessScore,
    },
    matchedBenchmarkSkills: matched,
    missingBenchmarkSkills: missing,
    improvementAreas,
    profileCompleteness: completionPercent,
    source: 'authoritative_engine',
  };
}

module.exports = {
  calculateCareerReadinessAuthoritative,
  ROLE_BENCHMARKS,
};

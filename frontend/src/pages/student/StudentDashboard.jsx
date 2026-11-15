import React, { useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import { Sparkles, FileText, Target, ArrowRight, BookOpen, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export default function StudentDashboard() {
  // Resume extraction state
  const [resumeText, setResumeText] = useState(
    'Final year B.Tech CSE student passionate about Web Development. Skilled in React, JavaScript, HTML, CSS, Tailwind CSS, Git, and REST APIs. Built 3 full-stack projects using Node.js and MongoDB.'
  );
  const [extractedSkills, setExtractedSkills] = useState(['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Git', 'REST API', 'Node.js', 'MongoDB']);
  const [extractLoading, setExtractLoading] = useState(false);

  // Skill gap state
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [gapData, setGapData] = useState({
    readiness_score: 85.7,
    gap_percentage: 14.3,
    acquired_skills: ['React', 'JavaScript', 'REST API', 'Git', 'Node.js', 'MongoDB'],
    missing_critical_skills: ['Express'],
    recommended_courses: [
      { skill: 'Express', title: 'Practical Guide to Express', estimated_hours: 12 }
    ]
  });
  const [gapLoading, setGapLoading] = useState(false);

  // Job matching simulation state
  const [matchResult, setMatchResult] = useState({
    jobTitle: 'Frontend Developer Intern @ ABC Technologies',
    score: 88,
    eligible: true,
  });

  const handleExtractSkills = async () => {
    setExtractLoading(true);
    try {
      const res = await api.extractSkills(resumeText);
      if (res.success && res.extracted_skills) {
        setExtractedSkills(res.extracted_skills);
      }
    } catch (err) {
      console.warn('FastAPI microservice unreachable, using local fallback:', err);
    } finally {
      setExtractLoading(false);
    }
  };

  const handleRunGapAnalysis = async (role) => {
    setTargetRole(role);
    setGapLoading(true);
    try {
      const res = await api.analyzeGap(role, extractedSkills);
      if (res.success) {
        setGapData(res);
      }
    } catch (err) {
      console.warn('Gap analysis service unreachable:', err);
    } finally {
      setGapLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-brand-900 to-brand-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, Student</h1>
            <p className="text-brand-200 text-sm mt-1">
              B.Tech Computer Science & Engineering • CGPA: 8.4 / 10 • University: Apex Institute of Technology
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[130px]">
            <p className="text-xs uppercase font-bold text-brand-200">Career Readiness</p>
            <p className="text-3xl font-black text-white mt-1">{gapData.readiness_score}%</p>
            <p className="text-[10px] text-brand-300 mt-0.5">Role: {targetRole}</p>
          </div>
        </div>

        {/* 2-Column Grid: AI Resume Parser & Career Gap Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Resume Text & Skill Extractor (FastAPI integration) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">AI Skill Extractor</h2>
                    <p className="text-xs text-slate-500">Live Python FastAPI microservice tester</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Port 8000 Active
                </span>
              </div>

              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parsed Resume Text / Project Summary
              </label>
              <textarea
                rows="4"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-slate-700 bg-slate-50/50"
              />

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={handleExtractSkills}
                  disabled={extractLoading}
                  className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{extractLoading ? 'Extracting...' : 'Extract Skills with AI'}</span>
                </button>
                <span className="text-[11px] text-slate-400">{extractedSkills.length} skills identified</span>
              </div>

              {/* Extracted Tags */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2">Normalized Extracted Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {extractedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-900 border border-brand-200/60"
                    >
                      <CheckCircle className="w-3 h-3 text-brand-600 mr-1" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 italic">
              Note: Day 1 demonstration uses standard skills dictionary; PyMuPDF PDF parsing connects in Phase 2.
            </p>
          </div>

          {/* Card 2: Skill Gap Analysis & Recommended Roadmaps */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Career Gap Benchmark</h2>
                    <p className="text-xs text-slate-500">Industry benchmark comparison</p>
                  </div>
                </div>
                <select
                  value={targetRole}
                  onChange={(e) => handleRunGapAnalysis(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 bg-white"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                </select>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Competency Match</span>
                  <span className="text-brand-900">{gapData.readiness_score}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${gapData.readiness_score}%` }}
                  ></div>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-rose-600 flex items-center mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Missing Critical Skills ({gapData.missing_critical_skills.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {gapData.missing_critical_skills.length > 0 ? (
                      gapData.missing_critical_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">None! All target skills satisfied.</span>
                    )}
                  </div>
                </div>

                {/* Recommended Roadmaps */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Recommended Learning Roadmap:
                  </span>
                  <div className="space-y-2">
                    {gapData.recommended_courses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                          <span className="text-xs font-medium text-slate-800">{course.title}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">~{course.estimated_hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              Generated via SkillBridge AI Gap Analysis Engine
            </div>
          </div>
        </div>

        {/* Section 3: Recommended Internships */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recommended Internships for You</h2>
              <p className="text-xs text-slate-500">Matched via intelligent weighted skill algorithm</p>
            </div>
            <span className="text-xs font-semibold text-brand-700 hover:text-brand-900 cursor-pointer">
              View All 14 Jobs &rarr;
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">Frontend Developer Intern</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    88% Match
                  </span>
                </div>
                <p className="text-xs text-slate-600">ABC Technologies • Remote • Stipend: ₹15,000/mo</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">React (35%)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">JavaScript (35%)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">Tailwind CSS (30%)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold transition-colors">
                  Apply Now
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">Full Stack Intern (MERN)</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    78% Match
                  </span>
                </div>
                <p className="text-xs text-slate-600">CloudMatrix Labs • Bangalore / Hybrid • Stipend: ₹20,000/mo</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">React</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">Node.js</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">MongoDB</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}


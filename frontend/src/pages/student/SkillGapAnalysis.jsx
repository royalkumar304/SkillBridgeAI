import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Sparkles,
  Target,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronLeft,
  Building2,
} from 'lucide-react';

export default function SkillGapAnalysis() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') || '';
  const initialRole = searchParams.get('targetRole') || 'Full Stack Developer';

  const [targetRole, setTargetRole] = useState(initialRole);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId);

  // Fetch list of active jobs for dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.getJobs();
        if (res.success && res.data) {
          const list = res.data.jobs || (Array.isArray(res.data) ? res.data : []);
          setAvailableJobs(list);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchJobs();
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const params = selectedJobId ? { jobId: selectedJobId } : { targetRole };
      const res = await api.getSkillGapAnalysis(params);
      if (res.success && res.data) {
        setAnalysis(res.data);
      } else {
        setError(res.message || 'Failed to analyze skill gap.');
      }
    } catch (err) {
      setError('Could not connect to skill gap engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedJobId, targetRole]);

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            to="/student/career/readiness"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-[#17233A] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">AI Skill Gap Analysis</h1>
            <p className="text-xs text-slate-400">
              Identify matched, missing, and partially matched competencies against target careers or specific job postings.
            </p>
          </div>
        </div>

        {/* Target Selector Toolbar */}
        <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Evaluate Against
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobId('')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                    !selectedJobId
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#111A2E] text-slate-300 border-slate-700 hover:bg-[#1E2D4A]'
                  }`}
                >
                  Role Benchmark
                </button>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                    selectedJobId
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#111A2E] text-slate-200 border-slate-700'
                  }`}
                >
                  <option value="" className="text-slate-200 bg-[#111A2E]">
                    Select Specific Corporate Job...
                  </option>
                  {availableJobs.map((j) => (
                    <option key={j._id} value={j._id} className="text-slate-200 bg-[#111A2E]">
                      {j.title} ({j.companyId?.name || j.companyName || 'Corporate Partner'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!selectedJobId && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Benchmark Career Path
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#111A2E] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Evaluating skill proficiency and level-aware gap coverage..." />
        ) : analysis ? (
          <div className="space-y-6">
            {/* Target Header Card */}
            <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                    {analysis.mode === 'JOB' ? 'Corporate Job Requirement' : 'Standard Industry Benchmark'}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-2">
                    {analysis.mode === 'JOB' ? analysis.job?.title : analysis.targetRole}
                  </h2>
                  {analysis.mode === 'JOB' && (
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      {analysis.job?.companyName} • {analysis.job?.location} • Min CGPA: {analysis.job?.minCGPA || 6.0}
                    </p>
                  )}
                </div>

                <div className="text-right self-end sm:self-auto bg-[#111A2E] px-4 py-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Skill Coverage</span>
                  <span
                    className={`text-3xl font-black ${
                      (analysis.skillCoverage ?? analysis.readinessScore) >= 75
                        ? 'text-emerald-400'
                        : (analysis.skillCoverage ?? analysis.readinessScore) >= 50
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {analysis.skillCoverage ?? analysis.readinessScore}%
                  </span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="mt-4">
                <div className="w-full h-2.5 bg-[#111A2E] rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${analysis.skillCoverage ?? analysis.readinessScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3 Categories: Matched, Partially Matched, Missing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Matched Skills */}
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Matched Skills
                  </span>
                  <span className="text-xs font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {analysis.matchedSkills?.length || analysis.acquiredSkills?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(analysis.matchedSkills || analysis.acquiredSkills || []).map((s, idx) => {
                    const name = typeof s === 'string' ? s : s.name;
                    const level = typeof s === 'object' ? s.student_level : null;
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#111A2E] border border-slate-800 text-xs">
                        <span className="font-bold text-slate-200">{name}</span>
                        {level && <span className="text-[10px] text-emerald-400 block mt-0.5">Proficiency: {level}</span>}
                      </div>
                    );
                  })}
                  {(!analysis.matchedSkills && !analysis.acquiredSkills) ||
                    ((analysis.matchedSkills?.length === 0) && (analysis.acquiredSkills?.length === 0) && (
                      <p className="text-xs text-slate-400 italic">No matching skills detected.</p>
                    ))}
                </div>
              </div>

              {/* Partially Matched Skills (Level Gap) */}
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Partially Matched
                  </span>
                  <span className="text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {analysis.partiallyMatchedSkills?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(analysis.partiallyMatchedSkills || []).map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#111A2E] border border-slate-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{p.name}</span>
                        <span className="text-[10px] font-semibold text-amber-400">Held: {p.student_level}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">{p.reason || `Requires ${p.required_level}`}</span>
                    </div>
                  ))}
                  {(!analysis.partiallyMatchedSkills || analysis.partiallyMatchedSkills.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No partial level gaps found.</p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Missing Competencies
                  </span>
                  <span className="text-xs font-black bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full">
                    {analysis.missingSkills?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(analysis.missingSkills || []).map((m, idx) => {
                    const name = typeof m === 'string' ? m : m.name;
                    const reqLevel = typeof m === 'object' ? m.required_level : null;
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#111A2E] border border-slate-800 text-xs">
                        <span className="font-bold text-slate-200">{name}</span>
                        {reqLevel && <span className="text-[10px] text-rose-400 block mt-0.5">Required Level: {reqLevel}</span>}
                      </div>
                    );
                  })}
                  {(!analysis.missingSkills || analysis.missingSkills.length === 0) && (
                    <p className="text-xs text-emerald-400 font-semibold">Zero missing skills! Complete coverage.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actionable Suggestions & Learning Path Shortcut */}
            {analysis.actionableSuggestions?.length > 0 && (
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Actionable Next Steps
                  </h3>
                  <Link
                    to={selectedJobId ? `/student/career/recommendations?jobId=${selectedJobId}` : `/student/career/recommendations?targetRole=${encodeURIComponent(targetRole)}`}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    View Full Learning Path <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {analysis.actionableSuggestions.map((sug, i) => (
                    <div key={i} className="p-3 bg-[#111A2E] border border-slate-800 rounded-xl text-xs text-slate-300 font-medium">
                      {sug}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </StudentLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Sparkles,
  Target,
  BookOpen,
  Briefcase,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Code2,
} from 'lucide-react';

export default function CareerReadiness() {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('Full Stack Developer');

  const ROLE_OPTIONS = [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'AI/ML Engineer',
    'Cloud & DevOps Engineer',
  ];

  const fetchReadiness = async (role) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getCareerReadiness(role);
      if (res.success && res.data) {
        setReadiness(res.data);
      } else {
        setError(res.message || 'Failed to evaluate career readiness.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness(selectedRole);
  }, [selectedRole]);

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Career Readiness Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white">Career Readiness Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent, explainable qualification scoring evaluated against live industry benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Benchmark Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#17233A] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Calculating career readiness score and benchmark coverage..." />
        ) : readiness && !readiness.sufficientData ? (
          <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-12 text-center">
            <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Insufficient Profile Data</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              {readiness.message || 'Please add skills, academic background, and projects to your profile to calculate an accurate career readiness score.'}
            </p>
            <Link
              to="/student/profile/edit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              Complete Student Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : readiness ? (
          <>
            {/* Primary Score Overview Card */}
            <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Readiness Index</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span
                      className={`text-5xl font-black ${
                        readiness.readinessScore >= 75
                          ? 'text-emerald-400'
                          : readiness.readinessScore >= 50
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {readiness.readinessScore}%
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Target Role: <strong className="text-white">{readiness.targetRole}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{readiness.message}</p>
                </div>

                {/* Score Dial / Bar Visual */}
                <div className="w-full md:w-64 bg-[#111A2E] p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Readiness Level</span>
                    <span>
                      {readiness.readinessScore >= 75
                        ? 'Placement Ready'
                        : readiness.readinessScore >= 50
                        ? 'Moderate Alignment'
                        : 'Foundational Stage'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#0B1020] rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-700 ${
                        readiness.readinessScore >= 75
                          ? 'bg-emerald-500'
                          : readiness.readinessScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${readiness.readinessScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Profile completeness: {readiness.profileCompleteness}%</span>
                </div>
              </div>

              {/* 3-Pillar Explainable Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="p-4 rounded-xl bg-[#111A2E] border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-300">Skill Coverage</span>
                    <span className="text-sm font-black text-blue-400">{readiness.breakdown?.skillCoverageScore} / 50 pts</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Matches {readiness.matchedBenchmarkSkills?.length || 0} of {((readiness.matchedBenchmarkSkills?.length || 0) + (readiness.missingBenchmarkSkills?.length || 0))} industry benchmark competencies.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#111A2E] border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-300">Practical Evidence</span>
                    <span className="text-sm font-black text-indigo-400">{readiness.breakdown?.practicalEvidenceScore} / 30 pts</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Evaluated from verified featured projects and relevant work/internship experience.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#111A2E] border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-300">Academic & Profile</span>
                    <span className="text-sm font-black text-violet-400">{readiness.breakdown?.academicCompletenessScore} / 20 pts</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Computed from institutional CGPA threshold and verified academic credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Benchmark Skills & Actionable Improvement Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Benchmark Skill Status */}
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  Industry Benchmark Skills ({readiness.targetRole})
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 mb-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Acquired Skills ({readiness.matchedBenchmarkSkills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {readiness.matchedBenchmarkSkills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 font-semibold rounded-lg border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                      {(!readiness.matchedBenchmarkSkills || readiness.matchedBenchmarkSkills.length === 0) && (
                        <span className="text-slate-400 italic">No matching skills detected for this benchmark.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-amber-400 font-bold flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing Core Skills ({readiness.missingBenchmarkSkills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {readiness.missingBenchmarkSkills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-amber-500/10 text-amber-300 font-semibold rounded-lg border border-amber-500/20">
                          {s}
                        </span>
                      ))}
                      {(!readiness.missingBenchmarkSkills || readiness.missingBenchmarkSkills.length === 0) && (
                        <span className="text-emerald-400 font-semibold">All benchmark skills satisfied!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Improvement Plan */}
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Targeted Improvement Areas
                  </h2>

                  <div className="space-y-2.5">
                    {readiness.improvementAreas?.map((area, idx) => (
                      <div key={idx} className="p-3 bg-[#111A2E] border border-slate-800 rounded-xl text-xs flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="text-slate-300 font-medium">{area}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2 mt-4">
                  <Link
                    to={`/student/career/gap?targetRole=${encodeURIComponent(selectedRole)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                  >
                    <span>Detailed Gap Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={`/student/career/recommendations?targetRole=${encodeURIComponent(selectedRole)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111A2E] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Learning Roadmap</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Link Card: Compare Against Live Jobs */}
            <div className="bg-gradient-to-r from-[#17233A] via-[#111A2E] to-[#1E2D4A] rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Compare Readiness Across Live Corporate Positions</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View how your verified profile stacks up against real company internship and placement criteria.
                </p>
              </div>
              <Link
                to="/student/career/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
              >
                <span>Job-Wise Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </StudentLayout>
  );
}

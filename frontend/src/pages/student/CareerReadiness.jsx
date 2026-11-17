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
  HelpCircle,
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Career Readiness Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1e3a5f]">Career Readiness Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent, explainable qualification scoring evaluated against live industry benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Benchmark Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
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
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Calculating career readiness score and benchmark coverage..." />
        ) : readiness && !readiness.sufficientData ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Insufficient Profile Data</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {readiness.message || 'Please add skills, academic background, and projects to your profile to calculate an accurate career readiness score.'}
            </p>
            <Link
              to="/student/profile/edit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-xs font-semibold rounded-xl hover:bg-[#16304f] transition-colors"
            >
              Complete Student Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : readiness ? (
          <>
            {/* Primary Score Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Readiness Index</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span
                      className={`text-5xl font-black ${
                        readiness.readinessScore >= 75
                          ? 'text-emerald-600'
                          : readiness.readinessScore >= 50
                          ? 'text-amber-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {readiness.readinessScore}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Target Role: <strong className="text-slate-800">{readiness.targetRole}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{readiness.message}</p>
                </div>

                {/* Score Dial / Bar Visual */}
                <div className="w-full md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Readiness Level</span>
                    <span>
                      {readiness.readinessScore >= 75
                        ? 'Placement Ready'
                        : readiness.readinessScore >= 50
                        ? 'Moderate Alignment'
                        : 'Foundational Stage'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        readiness.readinessScore >= 75
                          ? 'bg-emerald-600'
                          : readiness.readinessScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${readiness.readinessScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Profile completeness: {readiness.profileCompleteness}%</span>
                </div>
              </div>

              {/* 3-Pillar Explainable Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-600">Skill Coverage</span>
                    <span className="text-sm font-black text-indigo-700">{readiness.breakdown?.skillCoverageScore} / 50 pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Matches {readiness.matchedBenchmarkSkills?.length || 0} of {((readiness.matchedBenchmarkSkills?.length || 0) + (readiness.missingBenchmarkSkills?.length || 0))} industry benchmark competencies.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-600">Practical Evidence</span>
                    <span className="text-sm font-black text-indigo-700">{readiness.breakdown?.practicalEvidenceScore} / 30 pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Evaluated from verified featured projects and relevant work/internship experience.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-600">Academic & Profile</span>
                    <span className="text-sm font-black text-indigo-700">{readiness.breakdown?.academicCompletenessScore} / 20 pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Computed from institutional CGPA threshold and verified academic credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Benchmark Skills & Actionable Improvement Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Benchmark Skill Status */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-[#1e3a5f]" />
                  Industry Benchmark Skills ({readiness.targetRole})
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 mb-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Acquired Skills ({readiness.matchedBenchmarkSkills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {readiness.matchedBenchmarkSkills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-lg border border-emerald-200">
                          {s}
                        </span>
                      ))}
                      {(!readiness.matchedBenchmarkSkills || readiness.matchedBenchmarkSkills.length === 0) && (
                        <span className="text-slate-400 italic">No matching skills detected for this benchmark.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-amber-700 font-bold flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing Core Skills ({readiness.missingBenchmarkSkills?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {readiness.missingBenchmarkSkills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded-lg border border-amber-200">
                          {s}
                        </span>
                      ))}
                      {(!readiness.missingBenchmarkSkills || readiness.missingBenchmarkSkills.length === 0) && (
                        <span className="text-emerald-600 font-semibold">All benchmark skills satisfied!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Improvement Plan */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[#1e3a5f]" />
                    Targeted Improvement Areas
                  </h2>

                  <div className="space-y-2.5">
                    {readiness.improvementAreas?.map((area, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="text-slate-700 font-medium">{area}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 mt-4">
                  <Link
                    to={`/student/career/gap?targetRole=${encodeURIComponent(selectedRole)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <span>Detailed Gap Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={`/student/career/recommendations?targetRole=${encodeURIComponent(selectedRole)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Learning Roadmap</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Link Card: Compare Against Live Jobs */}
            <div className="bg-gradient-to-r from-brand-900 to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">Compare Readiness Across Live Corporate Positions</h3>
                <p className="text-xs text-brand-200 mt-0.5">
                  View how your verified profile stacks up against real company internship and placement criteria.
                </p>
              </div>
              <Link
                to="/student/career/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#1e3a5f] hover:bg-slate-100 text-xs font-bold rounded-xl shadow-sm transition-colors shrink-0"
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

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import { Sparkles, ArrowRight, ExternalLink, BookOpen, Layers } from 'lucide-react';

export default function LearningRecommendations() {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';
  const initialRole = searchParams.get('targetRole') || 'Full Stack Developer';

  const [targetRole, setTargetRole] = useState(initialRole);
  const [jobId, setJobId] = useState(initialJobId);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationData, setRecommendationData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [jobId, targetRole]);

  const loadJobs = async () => {
    try {
      const res = await api.getJobs({ limit: 20 });
      if (res && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err) {
      console.warn('Failed to load corporate jobs list', err);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (jobId) params.jobId = jobId;
      if (targetRole) params.targetRole = targetRole;

      const res = await api.getLearningRecommendations(params);
      setRecommendationData(res);
    } catch (err) {
      console.error('Failed to load recommendations', err);
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const filteredPaths = (recommendationData?.learningPaths || []).filter((item) => {
    if (selectedLevel === 'ALL') return true;
    return item.level.toUpperCase() === selectedLevel;
  });

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black text-white">Personalized Learning Recommendations</h1>
            <p className="text-sm text-slate-400 mt-1">
              Curated, beginner-to-advanced learning roadmaps linked to verified official documentation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/student/career/readiness"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-[#17233A] transition-colors"
            >
              ← Readiness Score
            </Link>
            <Link
              to="/student/career/gap"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-[#17233A] transition-colors"
            >
              Skill Gap Breakdown
            </Link>
            <Link
              to="/student/career/jobs"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transition-all"
            >
              Job-Wise Analysis →
            </Link>
          </div>
        </div>

        {/* Target Selector Card */}
        <div className="bg-[#17233A] p-5 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Industry Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => {
                setTargetRole(e.target.value);
                setJobId('');
              }}
              className="w-full px-3 py-2 text-sm border border-slate-700 rounded-xl bg-[#111A2E] text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
              <option value="Data & ML Engineer">Data & ML Engineer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Or Match Active Company Posting
            </label>
            <select
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-700 rounded-xl bg-[#111A2E] text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">-- Focus on General Role Benchmark --</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.company?.name || 'Company'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase mr-2">Filter Level:</span>
          {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedLevel === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#17233A] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="p-12 text-center bg-[#17233A] rounded-2xl border border-slate-800">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm text-slate-400">Generating personalized roadmap and retrieving verified resources...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && recommendationData && (
          <div className="space-y-6">
            {/* Missing Skills Summary Pill List */}
            {recommendationData.missingSkills && recommendationData.missingSkills.length > 0 && (
              <div className="bg-[#17233A] border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    Target Missing Skills Identified:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {recommendationData.missingSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Prioritized based on {jobId ? 'Job Requirements' : 'Role Benchmark'}
                </div>
              </div>
            )}

            {/* If No Recommendations / All Skills Acquired */}
            {filteredPaths.length === 0 && (
              <div className="p-8 text-center bg-[#17233A] rounded-2xl border border-slate-800">
                <span className="text-3xl mb-2 inline-block">🎉</span>
                <h3 className="text-base font-bold text-white">No Pending Skill Gaps!</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  You have acquired all benchmark skills for this category, or no resources match the selected filter level ({selectedLevel}).
                </p>
              </div>
            )}

            {/* Learning Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPaths.map((item, idx) => {
                const levelBadgeColors = {
                  BEGINNER: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                  INTERMEDIATE: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                  ADVANCED: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                };

                const priorityColors = {
                  HIGH: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                  MEDIUM: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                  LOW: 'bg-slate-800 text-slate-400 border-slate-700'
                };

                return (
                  <div
                    key={`${item.skill}-${idx}`}
                    className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#111A2E] text-slate-200 border border-slate-700">
                          {item.skill}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              levelBadgeColors[item.level.toUpperCase()] || 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.level.toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              priorityColors[item.priority] || 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 mt-2 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Provider: <strong className="text-slate-200">{item.provider}</strong></span>
                        <span>Est: <strong className="text-slate-200">{item.estimated_hours} hrs</strong></span>
                      </div>

                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
                        >
                          Open Verified Docs
                          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic block text-center">
                          Official guide recommended
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

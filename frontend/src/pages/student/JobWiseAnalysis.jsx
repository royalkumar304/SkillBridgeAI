import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function JobWiseAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState('matchScore'); // 'matchScore' | 'missingCount'

  useEffect(() => {
    fetchJobWiseData();
  }, []);

  const fetchJobWiseData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getJobWiseAnalysis();
      setData(res);
    } catch (err) {
      console.error('Failed to load job-wise career analysis', err);
      setError(err.message || 'Failed to fetch job analysis data');
    } finally {
      setLoading(false);
    }
  };

  const jobsList = (data?.jobs || []).filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(q) ||
      (item.companyName || '').toLowerCase().includes(q)
    );
  });

  const sortedJobs = [...jobsList].sort((a, b) => {
    if (sortBy === 'matchScore') {
      return (b.skillCoverage || 0) - (a.skillCoverage || 0);
    }
    return (a.missingSkillsCount || 0) - (b.missingSkillsCount || 0);
  });

  const totalOps = data?.totalJobsAnalyzed || 0;
  const highMatchCount = (data?.jobs || []).filter((j) => (j.skillCoverage || 0) >= 70).length;
  const modMatchCount = (data?.jobs || []).filter((j) => (j.skillCoverage || 0) >= 40 && (j.skillCoverage || 0) < 70).length;
  const lowMatchCount = (data?.jobs || []).filter((j) => (j.skillCoverage || 0) < 40).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job-Wise Career Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comparative AI assessment across all active corporate job opportunities based on your registered skills.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/student/career/readiness"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Readiness Score
          </Link>
          <Link
            to="/student/career/gap"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Skill Gap Breakdown
          </Link>
          <Link
            to="/student/career/recommendations"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Learning Roadmap
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium uppercase">Active Opportunities</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalOps}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-emerald-600 font-medium uppercase">High Match (&gt;=70%)</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{highMatchCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-amber-600 font-medium uppercase">Moderate Match (40-69%)</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{modMatchCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-rose-600 font-medium uppercase">Low Match (&lt;40%)</span>
            <p className="text-2xl font-bold text-rose-600 mt-1">{lowMatchCount}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by job title or company..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="matchScore">Highest Match Score</option>
            <option value="missingCount">Fewest Missing Skills</option>
          </select>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Analyzing job opportunities against your profile skills...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table / List */}
      {!loading && !error && data && (
        <div>
          {sortedJobs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">No matching corporate opportunities found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Job & Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Match Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Skills Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Missing Skills
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedJobs.map((item) => {
                      const matchPct = item.skillCoverage || 0;
                      const badgeClass =
                        matchPct >= 70
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : matchPct >= 40
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200';

                      return (
                        <tr key={item.jobId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.companyName || 'Corporate Partner'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`}
                            >
                              {matchPct}% Match
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 font-semibold">{item.matchedSkillsCount || 0} matched</span>
                              <span>•</span>
                              <span className="text-amber-700 font-semibold">{item.partialSkillsCount || 0} partial</span>
                              <span>•</span>
                              <span className="text-rose-700 font-semibold">{item.missingSkillsCount || 0} missing</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {!item.missingSkills || item.missingSkills.length === 0 ? (
                              <span className="text-xs text-emerald-600 font-medium">Full skill coverage</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {item.missingSkills.slice(0, 3).map((sk) => (
                                  <span
                                    key={typeof sk === 'string' ? sk : sk.name}
                                    className="px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-700 border border-rose-200"
                                  >
                                    {typeof sk === 'string' ? sk : sk.name}
                                  </span>
                                ))}
                                {item.missingSkills.length > 3 && (
                                  <span className="text-[11px] text-gray-400 self-center">
                                    +{item.missingSkills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            <Link
                              to={`/student/career/gap?jobId=${item.jobId}`}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Detailed Gap →
                            </Link>
                            <Link
                              to={`/student/career/recommendations?jobId=${item.jobId}`}
                              className="text-xs font-semibold text-gray-600 hover:text-gray-900 ml-3"
                            >
                              Roadmap
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

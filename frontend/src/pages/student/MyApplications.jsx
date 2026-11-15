import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { Briefcase, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getMyApplications();
        if (res.success) {
          const list = res.data?.applications || (Array.isArray(res.data) ? res.data : []);
          setApplications(list);
        } else {
          setError(res.message || 'Failed to load applications.');
        }
      } catch (e) {
        setError('Could not connect to server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3a5f]">My Applications</h1>
          <p className="text-xs text-slate-500 mt-1">Track the live recruitment status of all your submitted internship and placement applications.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading your submitted applications..." />
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold mb-2">No applications submitted yet.</p>
            <p className="text-xs text-slate-400 mb-6">Explore open listings and apply with your verified skills profile.</p>
            <Link
              to="/student/jobs"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              Browse Open Positions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-5">Job Title</th>
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-5">Match Score</th>
                    <th className="py-3 px-5">Applied Date</th>
                    <th className="py-3 px-5">Application Status</th>
                    <th className="py-3 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const job = app.jobId || {};
                    const appliedDate = app.appliedAt || app.createdAt
                      ? new Date(app.appliedAt || app.createdAt).toLocaleDateString()
                      : '—';
                    return (
                      <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 font-semibold text-slate-900">
                          {job.title || 'Position'}
                        </td>
                        <td className="py-4 px-5 text-slate-600">
                          {job.companyId?.name || job.companyName || 'Corporate Partner'}
                        </td>
                        <td className="py-4 px-5">
                          {app.matchScore !== undefined && app.matchScore !== null ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              app.matchScore >= 75
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.matchScore >= 50
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {app.matchScore}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-xs">{appliedDate}</td>
                        <td className="py-4 px-5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-4 px-5 text-right">
                          {job._id && (
                            <Link
                              to={`/student/jobs/${job._id}`}
                              className="text-xs text-[#1e3a5f] hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
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
    </StudentLayout>
  );
}

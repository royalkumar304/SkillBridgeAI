import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Briefcase, Plus, Users, Edit3, Trash2, CheckCircle2,
  AlertCircle, Building2, Calendar, MapPin, Eye
} from 'lucide-react';

export default function ManageJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({ myJobs: true });
      if (res.success) {
        const list = res.data?.jobs || (Array.isArray(res.data) ? res.data : []);
        setJobs(list);
      } else {
        setError(res.message || 'Failed to load your posted jobs.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleToggleStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      const res = await api.updateJobStatus(jobId, newStatus);
      if (res.success) {
        setActionMsg(`Job status updated to ${newStatus}`);
        setJobs(jobs.map((j) => (j._id === jobId ? { ...j, status: newStatus } : j)));
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to close and archive this job posting?')) return;
    try {
      const res = await api.deleteJob(jobId);
      if (res.success) {
        setActionMsg('Job closed successfully');
        setJobs(jobs.map((j) => (j._id === jobId ? { ...j, status: 'closed' } : j)));
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (e) {
      setError('Failed to delete job.');
    }
  };

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e3a5f]">Manage Opportunities</h1>
            <p className="text-xs text-slate-500 mt-1">Review active openings, screen applicants, and manage recruitment lifecycles.</p>
          </div>
          <Link
            to="/recruiter/jobs/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post New Opportunity
          </Link>
        </div>

        {actionMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" /> {actionMsg}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading your recruitment listings..." />
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold mb-1">No jobs posted yet</p>
            <p className="text-xs text-slate-500 mb-6">Create your first internship or placement posting to begin receiving ranked candidates.</p>
            <Link
              to="/recruiter/jobs/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#16304f] transition-colors"
            >
              Post First Job Now
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-5">Job Details</th>
                    <th className="py-3 px-5">Type / Location</th>
                    <th className="py-3 px-5">Deadline</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => {
                    const deadline = job.deadline ? new Date(job.deadline) : null;
                    const isPast = deadline && deadline < new Date();
                    return (
                      <tr key={job._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900 text-sm">{job.title}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-[#1e3a5f]" />
                            {job.companyId?.name || job.companyName || 'Corporate Partner'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(job.requiredSkills || []).slice(0, 3).map((s, idx) => (
                              <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                {s.name}
                              </span>
                            ))}
                            {(job.requiredSkills || []).length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{(job.requiredSkills || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5 text-xs text-slate-600">
                          <p className="font-medium capitalize">{job.jobType?.replace('_', ' ')}</p>
                          <p className="text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location || 'Remote'}
                          </p>
                        </td>

                        <td className="py-4 px-5 text-xs">
                          {deadline ? (
                            <span className={isPast ? 'text-red-500 font-semibold' : 'text-slate-600'}>
                              {deadline.toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              job.status === 'active' || job.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : job.status === 'draft'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right space-x-2">
                          <Link
                            to={`/recruiter/jobs/${job._id}/applications`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Applicants
                          </Link>

                          <Link
                            to={`/recruiter/jobs/${job._id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </Link>

                          <button
                            onClick={() => handleToggleStatus(job._id, job.status)}
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                          >
                            {job.status === 'active' ? 'Close' : 'Publish'}
                          </button>
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
    </RecruiterLayout>
  );
}

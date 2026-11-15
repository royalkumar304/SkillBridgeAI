import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import {
  Users, ChevronLeft, AlertCircle, CheckCircle2, GraduationCap,
  Sparkles, Mail, Check, X, Building2
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
];

export default function JobApplicants() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.getJobApplications(id);
      if (res.success && res.data) {
        setApplications(res.data.applications || []);
        if (res.data.job) setJob(res.data.job);
      } else {
        setError(res.message || 'Failed to retrieve applicants.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [id]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await api.updateApplicationStatus(appId, newStatus);
      if (res.success) {
        setApplications(
          applications.map((app) =>
            app._id === appId ? { ...app, status: newStatus } : app
          )
        );
        setToast({ type: 'success', msg: `Candidate status updated to ${newStatus.replace('_', ' ')}` });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ type: 'error', msg: res.message || 'Failed to update status' });
      }
    } catch (e) {
      setToast({ type: 'error', msg: 'Network error. Please try again.' });
    }
  };

  if (loading) return <RecruiterLayout><LoadingSpinner message="Loading candidate profiles & match rankings..." /></RecruiterLayout>;

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/jobs"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e3a5f]">
              {job?.title || 'Opportunity'} — Candidates
            </h1>
            <p className="text-xs text-slate-500">
              Total Applicants: {applications.length} • Auto-ranked via SkillBridge Explainable Match Engine
            </p>
          </div>
        </div>

        {toast && (
          <div
            className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            {toast.msg}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold mb-1">No applicants yet</p>
            <p className="text-xs text-slate-500">
              When students apply to this opportunity, their verified profiles and explainable match scores will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const student = app.studentId || {};
              const profile = app.studentProfile || {};
              const appliedDate = app.appliedAt || app.createdAt
                ? new Date(app.appliedAt || app.createdAt).toLocaleDateString()
                : '—';

              return (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{student.name || 'Candidate'}</h2>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {student.email}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                        {profile.university && (
                          <span className="flex items-center gap-1 font-medium">
                            <GraduationCap className="w-3.5 h-3.5 text-[#1e3a5f]" /> {profile.university}
                          </span>
                        )}
                        {profile.degree && <span>{profile.degree} in {profile.branch || 'Engineering'}</span>}
                        {profile.cgpa !== undefined && (
                          <span className="font-semibold text-slate-800">CGPA: {profile.cgpa} / 10.0</span>
                        )}
                        {profile.graduationYear && <span>Class of {profile.graduationYear}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Match Score</span>
                        <span
                          className={`text-lg font-black ${
                            app.matchScore >= 75
                              ? 'text-emerald-600'
                              : app.matchScore >= 50
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {app.matchScore}%
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Status</span>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-slate-50 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Verified Skills:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(profile.skills || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded-full border border-indigo-100"
                          >
                            {s.name} <span className="opacity-60 text-[10px]">· {s.level}</span>
                          </span>
                        ))}
                        {(!profile.skills || profile.skills.length === 0) && (
                          <span className="text-slate-400 italic">No skills listed</span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px] self-end sm:self-auto shrink-0">
                      Applied on: {appliedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
}

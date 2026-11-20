import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Briefcase,
  Plus,
  Users,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Laptop,
} from 'lucide-react';

export default function ManageInternships() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  const loadInternships = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({ myJobs: true });
      if (res.success) {
        const list = res.data?.jobs || (Array.isArray(res.data) ? res.data : []);
        // Strictly filter to internships
        const onlyInternships = list.filter((j) => j.jobType === 'internship');
        setInternships(onlyInternships);
      } else {
        setError(res.message || 'Failed to load your posted internships.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, []);

  const handleToggleStatus = async (internshipId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      const res = await api.updateJobStatus(internshipId, newStatus);
      if (res.success) {
        setActionMsg(`Internship status updated to ${newStatus}`);
        setInternships(internships.map((j) => (j._id === internshipId ? { ...j, status: newStatus } : j)));
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  const handleClose = async (internshipId) => {
    if (!window.confirm('Are you sure you want to close this internship?')) return;
    try {
      const res = await api.deleteJob(internshipId);
      if (res.success) {
        setActionMsg('Internship successfully closed.');
        setInternships(internships.map((j) => (j._id === internshipId ? { ...j, status: 'closed' } : j)));
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (e) {
      setError('Failed to close internship.');
    }
  };

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-6 h-6 text-brand-600" />
              <span>Manage Industry Internships</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Publish, review applicants, and manage candidate shortlisting for your company's internship programs.
            </p>
          </div>
          <Link
            to="/recruiter/jobs/create"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Internship</span>
          </Link>
        </div>

        {actionMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading company internships..." />
          </div>
        ) : internships.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No internships posted yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create an internship opening to begin accepting applications from talented university students.
            </p>
            <Link
              to="/recruiter/jobs/create"
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-brand-900 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Internship Now</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {internships.map((internship) => {
              const isActive = internship.status === 'active' || internship.status === 'published';
              return (
                <div
                  key={internship._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <h2 className="text-base font-bold text-slate-900">{internship.title}</h2>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isActive ? 'Active' : 'Closed'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{internship.location || 'Remote'}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-semibold text-emerald-700">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{internship.stipend}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{internship.duration || '3 Months'}</span>
                      </span>
                      <span className="flex items-center space-x-1 capitalize">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span>{internship.workMode || 'Remote'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {new Date(internship.deadline).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(internship.requiredSkills || []).slice(0, 4).map((sk) => (
                        <span
                          key={sk.name}
                          className="px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-600 rounded-md border border-slate-200"
                        >
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <Link
                      to={`/recruiter/jobs/${internship._id}/applications`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors"
                      title="View Applicants"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review Applicants</span>
                    </Link>

                    <Link
                      to={`/recruiter/jobs/${internship._id}/edit`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Internship"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleToggleStatus(internship._id, internship.status)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title={isActive ? 'Mark as Closed' : 'Mark as Active'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </button>

                    <button
                      onClick={() => handleClose(internship._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Close Internship"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

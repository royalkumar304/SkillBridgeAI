import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SkillChip from '../../components/SkillChip';
import {
  MapPin, Calendar, Briefcase, ChevronLeft, AlertCircle,
  CheckCircle, Ban, DollarSign, GraduationCap, Sparkles, Building2,
  Check, X, HelpCircle
} from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyState, setApplyState] = useState('idle'); // idle | loading | success | already | error
  const [applyMsg, setApplyMsg] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(true);

  useEffect(() => {
    const loadJobAndMatch = async () => {
      try {
        const [jobRes, matchRes] = await Promise.all([
          api.getJobById(id),
          api.getJobMatch(id).catch(() => null),
        ]);

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data.job || jobRes.data);
        } else {
          setError(jobRes.message || 'Job not found.');
        }

        if (matchRes && matchRes.success && matchRes.data) {
          setMatchData(matchRes.data);
        }
      } catch (e) {
        setError('Could not load job details.');
      } finally {
        setLoading(false);
        setMatchLoading(false);
      }
    };
    loadJobAndMatch();
  }, [id]);

  const deadline = job?.deadline ? new Date(job.deadline) : null;
  const isPast = deadline && deadline < new Date();
  const companyTitle = job?.companyId?.name || job?.companyName || 'Corporate Partner';

  const handleApply = async () => {
    setApplyState('loading');
    try {
      const res = await api.applyToJob(id);
      if (res._status === 409) {
        setApplyState('already');
        setApplyMsg('You have already applied to this job.');
      } else if (res.success) {
        setApplyState('success');
        setApplyMsg('Application submitted successfully!');
      } else {
        setApplyState('error');
        setApplyMsg(res.message || 'Failed to submit application.');
      }
    } catch (e) {
      setApplyState('error');
      setApplyMsg('Network error. Please try again.');
    }
  };

  if (loading) return <StudentLayout><LoadingSpinner message="Loading job details..." /></StudentLayout>;

  if (error || !job) {
    return (
      <StudentLayout>
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {error || 'Job not found.'}
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <Link to="/student/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#1e3a5f] font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Job Listings
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1e3a5f] leading-tight">{job.title}</h1>
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-1 mt-1">
                <Building2 className="w-4 h-4 text-[#1e3a5f]" /> {companyTitle}
              </p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${
              job.status === 'active' || job.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {job.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 mt-4 mb-5">
            {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{job.location}</span>}
            {job.jobType && <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" />{job.jobType.replace('_', ' ')}</span>}
            {job.stipend && <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" />₹{job.stipend}/mo</span>}
            {job.minCGPA !== undefined && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-slate-400" />Min CGPA: {job.minCGPA}</span>}
            {deadline && (
              <span className={`flex items-center gap-1.5 ${isPast ? 'text-red-500 font-semibold' : ''}`}>
                <Calendar className="w-4 h-4" />
                {isPast ? 'Application deadline passed' : `Apply before ${deadline.toLocaleDateString()}`}
              </span>
            )}
          </div>

          {/* Apply button / feedback */}
          {applyState === 'idle' && (
            <button
              onClick={handleApply}
              disabled={isPast || (job.status !== 'active' && job.status !== 'published')}
              className="px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold text-sm rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPast ? 'Application Closed' : 'Apply for this Position'}
            </button>
          )}
          {applyState === 'loading' && (
            <button disabled className="px-6 py-2.5 bg-[#1e3a5f] text-white font-semibold text-sm rounded-xl opacity-60">
              Submitting Application…
            </button>
          )}
          {(applyState === 'success' || applyState === 'already' || applyState === 'error') && (
            <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium ${
              applyState === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : applyState === 'already' ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {applyState === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
               : applyState === 'already' ? <Ban className="w-5 h-5 text-blue-600 shrink-0" />
               : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <span>{applyMsg}</span>
            </div>
          )}
        </div>

        {/* Explainable AI Match Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              SkillBridge Explainable Match Analysis
            </h2>
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              FastAPI Engine
            </span>
          </div>

          {matchLoading ? (
            <p className="text-xs text-slate-400">Evaluating profile against job requirements...</p>
          ) : matchData && matchData.profileComplete === false ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <p className="font-semibold mb-1">Incomplete Profile</p>
              <p>{matchData.message}</p>
              <Link to="/student/profile/edit" className="inline-block mt-2 font-bold text-[#1e3a5f] underline">
                Update Profile Now →
              </Link>
            </div>
          ) : matchData && matchData.profileComplete === true ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Calculated Match Compatibility</span>
                  <p className="text-xs text-slate-400 mt-0.5">Based on weighted skills & academic eligibility</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${
                    matchData.matchPercentage >= 75 ? 'text-emerald-600' : matchData.matchPercentage >= 50 ? 'text-amber-600' : 'text-slate-700'
                  }`}>
                    {matchData.matchPercentage}%
                  </span>
                </div>
              </div>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 mb-2">
                    <Check className="w-3.5 h-3.5" /> Matched Skills ({matchData.matchedSkills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.matchedSkills?.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded-full">
                        {s}
                      </span>
                    )) || <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-800 mb-2">
                    <X className="w-3.5 h-3.5" /> Missing Skills ({matchData.missingSkills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.missingSkills?.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 font-medium rounded-full">
                        {s}
                      </span>
                    )) || <span className="text-xs text-slate-400">All required skills met!</span>}
                  </div>
                </div>
              </div>

              {/* Transparent Explanation */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> How is this score calculated?
                </div>
                <p>{matchData.explanation}</p>
                {matchData.recommendation && (
                  <p className="mt-1.5 font-medium text-slate-700">{matchData.recommendation}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Unable to retrieve AI matching insights.</p>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Job Description & Responsibilities</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        {/* Required Skills */}
        {job.requiredSkills?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Required Skill Breakdown</h2>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full">
                  {s.name}
                  {s.weight && <span className="opacity-60">· Weight: {s.weight}%</span>}
                  {s.minimumLevel && <span className="opacity-60">· {s.minimumLevel}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Skills */}
        {job.preferredSkills?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Preferred Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.preferredSkills.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allowed Branches */}
        {job.allowedBranches?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Eligible Branches / Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {job.allowedBranches.map((b, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">{b}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

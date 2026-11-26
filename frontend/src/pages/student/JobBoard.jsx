import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SkillChip from '../../components/SkillChip';
import { Search, MapPin, Briefcase, Calendar, ChevronRight, AlertCircle, Building2 } from 'lucide-react';

const JOB_TYPES = ['', 'internship', 'full_time', 'part_time'];
const JOB_TYPE_LABELS = { '': 'All Types', internship: 'Internship', full_time: 'Full Time', part_time: 'Part Time' };

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getJobs({
        jobType: jobType || undefined,
        location: location || undefined,
      });
      if (res.success) {
        const list = res.data?.jobs || (Array.isArray(res.data) ? res.data : []);
        setJobs(list);
      } else {
        setError(res.message || 'Failed to load jobs.');
      }
    } catch (e) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }, [jobType, location]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Client-side search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(jobs);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.companyName?.toLowerCase().includes(q) ||
          j.companyId?.name?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          j.requiredSkills?.some((s) => s.name?.toLowerCase().includes(q))
      )
    );
  }, [search, jobs]);

  const uniqueLocations = [...new Set(jobs.map((j) => j.location).filter(Boolean))];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Opportunities & Placement Board</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified internship and full-time placement openings curated for academia-industry collaboration.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by role, company, skill or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-[#111A2E] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 bg-[#111A2E] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {JOB_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 bg-[#111A2E] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Fetching live job listings..." />
        ) : filtered.length === 0 ? (
          <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-white font-semibold">No job openings found.</p>
            {search && <p className="text-xs text-slate-400 mt-1">Try clearing your filters or search keywords.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function JobCard({ job }) {
  const deadline = job.deadline ? new Date(job.deadline) : null;
  const isPast = deadline && deadline < new Date();
  const companyTitle = job.companyId?.name || job.companyName || 'Corporate Partner';

  return (
    <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="font-bold text-white text-base leading-tight">{job.title}</h3>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> {companyTitle}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              job.jobType === 'internship'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : job.jobType === 'full_time'
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}
          >
            {JOB_TYPE_LABELS[job.jobType] || job.jobType}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 mb-3">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location}
            </span>
          )}
          {job.stipend && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-emerald-400">₹{job.stipend}/mo</span>
            </span>
          )}
          {deadline && (
            <span className={`flex items-center gap-1 ${isPast ? 'text-rose-400' : 'text-slate-400'}`}>
              <Calendar className="w-3.5 h-3.5" />
              {isPast ? 'Closed' : `Deadline: ${deadline.toLocaleDateString()}`}
            </span>
          )}
        </div>

        {job.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills.slice(0, 5).map((s, i) => (
              <SkillChip key={i} name={s.name} />
            ))}
            {job.requiredSkills.length > 5 && (
              <span className="text-xs text-slate-400">+{job.requiredSkills.length - 5} more</span>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">Min CGPA: <strong className="text-slate-300">{job.minCGPA || 6.0}</strong></span>
        <Link
          to={`/student/jobs/${job._id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          View & Apply <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

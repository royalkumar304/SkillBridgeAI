import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SkillChip from '../../components/SkillChip';
import {
  Search,
  MapPin,
  Briefcase,
  Calendar,
  ChevronRight,
  AlertCircle,
  Building2,
  DollarSign,
  Clock,
  Laptop,
  CheckCircle,
  Filter,
} from 'lucide-react';

export default function InternshipBoard() {
  const [internships, setInternships] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Applied map for student status tracking
  const [appliedMap, setAppliedMap] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [stipendFilter, setStipendFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.getJobs({ jobType: 'internship' }),
        api.getMyApplications().catch(() => ({ success: false })),
      ]);

      if (jobsRes.success) {
        const list = jobsRes.data?.jobs || (Array.isArray(jobsRes.data) ? jobsRes.data : []);
        // Strictly filter to internships
        const onlyInternships = list.filter((j) => j.jobType === 'internship');
        setInternships(onlyInternships);
      } else {
        setError(jobsRes.message || 'Failed to load internships.');
      }

      if (appsRes.success) {
        const apps = appsRes.data?.applications || [];
        const map = {};
        apps.forEach((app) => {
          const jId = app.jobId?._id || app.jobId;
          if (jId) {
            map[String(jId)] = app.status;
          }
        });
        setAppliedMap(map);
      }
    } catch (e) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side multi-filtering
  useEffect(() => {
    let result = [...internships];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.companyName?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    if (location.trim()) {
      const locQ = location.toLowerCase();
      result = result.filter((i) => i.location?.toLowerCase().includes(locQ));
    }

    if (workMode) {
      result = result.filter((i) => (i.workMode || 'remote').toLowerCase() === workMode.toLowerCase());
    }

    if (skillFilter.trim()) {
      const skillQ = skillFilter.toLowerCase();
      result = result.filter((i) =>
        (i.requiredSkills || []).some((s) => s.name?.toLowerCase().includes(skillQ))
      );
    }

    if (stipendFilter === 'paid') {
      result = result.filter((i) => {
        const s = (i.stipend || '').toLowerCase();
        return !s.includes('unpaid') && s !== '0';
      });
    } else if (stipendFilter === 'unpaid') {
      result = result.filter((i) => {
        const s = (i.stipend || '').toLowerCase();
        return s.includes('unpaid') || s === '0';
      });
    }

    setFiltered(result);
  }, [internships, search, location, workMode, skillFilter, stipendFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Applied</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      case 'shortlisted':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Shortlisted 🎉</span>;
      case 'interview_scheduled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Interview Scheduled 🗓️</span>;
      case 'selected':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Selected 🌟</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Not Selected</span>;
      default:
        return null;
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-6 h-6 text-brand-600" />
              <span>Internship Opportunity Board</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse, filter, and apply for vetted industry internships with transparent stipend and duration details.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="font-semibold text-brand-900">{filtered.length}</span> Opportunities Available
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Title / Company Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by title, company, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Location Search */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Filter by location (e.g. Remote, Bengaluru)..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Skill Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Filter by required skill (e.g. React, Python)..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Work Mode:</span>
            {['', 'remote', 'hybrid', 'on_site'].map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkMode(mode)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  workMode === mode
                    ? 'bg-brand-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode === '' ? 'All Modes' : mode === 'on_site' ? 'On-Site' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}

            <span className="text-slate-400 mx-2">|</span>

            <span className="text-slate-500 font-medium">Stipend:</span>
            {[
              { id: '', label: 'All' },
              { id: 'paid', label: 'Paid Only' },
              { id: 'unpaid', label: 'Unpaid / Performance' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStipendFilter(st.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  stipendFilter === st.id
                    ? 'bg-brand-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Loading industry internships..." />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No matching internships found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, location filter, or stipend options to discover open positions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((internship) => {
              const status = appliedMap[String(internship._id)];
              return (
                <div
                  key={internship._id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Company, status, workMode */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand-700">{internship.companyName}</p>
                          <h2 className="text-base font-bold text-slate-900 leading-snug">{internship.title}</h2>
                        </div>
                      </div>
                      {status ? getStatusBadge(status) : null}
                    </div>

                    {/* Metadata pill row */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600">
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
                    </div>

                    {/* Eligibility details */}
                    <div className="mt-3 text-xs text-slate-500 flex items-center space-x-3">
                      <span>Min CGPA: <strong className="text-slate-700">{internship.minCGPA || 6.0}</strong></span>
                      {internship.allowedBranches && internship.allowedBranches.length > 0 && (
                        <span>Branches: <strong className="text-slate-700">{internship.allowedBranches.join(', ')}</strong></span>
                      )}
                    </div>

                    {/* Required Skills Chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(internship.requiredSkills || []).slice(0, 5).map((sk) => (
                        <SkillChip key={sk.name} skill={sk.name} />
                      ))}
                      {(internship.requiredSkills || []).length > 5 && (
                        <span className="text-[11px] font-medium text-slate-400 self-center">
                          +{internship.requiredSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Deadline: {internship.deadline ? new Date(internship.deadline).toLocaleDateString() : 'Rolling'}
                      </span>
                    </span>

                    <Link
                      to={`/student/jobs/${internship._id}`}
                      className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 transition-colors shadow-sm"
                    >
                      <span>{status ? 'View Application' : 'Inspect & Apply'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

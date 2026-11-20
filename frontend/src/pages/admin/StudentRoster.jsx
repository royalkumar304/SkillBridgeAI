import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Search, Filter, GraduationCap, ChevronLeft, ChevronRight, Award, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function StudentRoster() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [minCGPA, setMinCGPA] = useState('');

  useEffect(() => {
    fetchStudents(1);
  }, [branchFilter, minCGPA]);

  const fetchStudents = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToLoad,
        limit: 15,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter) params.branch = branchFilter;
      if (minCGPA) params.minCGPA = minCGPA;

      const res = await api.getAdminStudents(params);
      if (res.success && res.data) {
        setStudents(res.data.students || []);
        setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      } else {
        setError(res.message || 'Failed to fetch student directory');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Network error fetching students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Talent Directory</h1>
            <p className="text-xs text-slate-500 mt-1">
              Search and filter enrolled students, skill profiles, and career readiness scores.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 text-brand-800 border border-brand-200 self-start sm:self-auto">
            Total Students Mapped: {pagination.total}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search student by name or university email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white text-slate-700"
              >
                <option value="">All Academic Branches</option>
                <option value="Computer Science">Computer Science / IT</option>
                <option value="Electronics">Electronics & Communication</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Electrical">Electrical Engineering</option>
              </select>
            </div>

            {/* Min CGPA Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={minCGPA}
                onChange={(e) => setMinCGPA(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white text-slate-700"
              >
                <option value="">Any CGPA Cutoff</option>
                <option value="8.0">CGPA ≥ 8.0</option>
                <option value="7.5">CGPA ≥ 7.5</option>
                <option value="7.0">CGPA ≥ 7.0</option>
                <option value="6.0">CGPA ≥ 6.0</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin h-7 w-7 border-4 border-brand-800 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Querying student records and readiness indices...</p>
          </div>
        )}

        {/* Students Table */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Students Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No registered student records matched your search filters. Try resetting the criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Student Profile</th>
                      <th className="px-6 py-3.5 text-left">Branch & Degree</th>
                      <th className="px-6 py-3.5 text-left">Academic CGPA</th>
                      <th className="px-6 py-3.5 text-left">Skills Mapped</th>
                      <th className="px-6 py-3.5 text-left">Applications</th>
                      <th className="px-6 py-3.5 text-left">Readiness Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {students.map((s) => {
                      const readinessColor =
                        s.readinessScore >= 70
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : s.readinessScore >= 40
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200';

                      return (
                        <tr key={s.id || s.profileId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-500">{s.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{s.branch || 'General'}</div>
                            <div className="text-[11px] text-slate-500">{s.degree} ({s.graduationYear || '2026'})</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {s.cgpa > 0 ? s.cgpa.toFixed(2) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {s.skillsCount} Technical Skills
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-slate-700">
                              {s.applicationCount} applied
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold border text-[11px] ${readinessColor}`}
                            >
                              <Award className="w-3 h-3 mr-1" />
                              {s.readinessScore}% Score
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50">
                <span>
                  Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchStudents(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchStudents(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

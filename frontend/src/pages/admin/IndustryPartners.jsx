import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Building2,
  CheckCircle,
  XCircle,
  Briefcase,
  Users,
  Search,
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export default function IndustryPartners() {
  const [partners, setPartners] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'internships'
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [partRes, intRes] = await Promise.all([
          api.getIndustryPartners().catch(() => ({ success: false })),
          api.getAdminInternships().catch(() => ({ success: false })),
        ]);

        if (partRes.success) {
          setPartners(partRes.data?.partners || []);
        }
        if (intRes.success) {
          setInternships(intRes.data?.internships || []);
        }
      } catch (err) {
        setError('Failed to load industry partners and internship governance data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPartners = partners.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.industry?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInternships = internships.filter(
    (i) =>
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      i.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-brand-600" />
              <span>Industry Partners & Internship Governance</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Oversee corporate collaboration agreements, active job/internship pipelines, and campus placement numbers.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'partners'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Industry Partners ({partners.length})
            </button>
            <button
              onClick={() => setActiveTab('internships')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'internships'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Internships ({internships.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === 'partners'
                  ? 'Search partners by company name, industry, or location...'
                  : 'Search active internships by title, company, or location...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading industry collaboration metrics..." />
          </div>
        ) : activeTab === 'partners' ? (
          /* Partners View */
          filteredPartners.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No industry partners found</h3>
              <p className="text-xs text-slate-500 mt-1">No corporate entities match your query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          partner.verified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {partner.verified ? 'Verified' : 'Pending Approval'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{partner.name}</h3>
                      <p className="text-xs text-slate-500">{partner.industry} • {partner.location}</p>
                    </div>

                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center space-x-1"
                      >
                        <span>{partner.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Metrics grid */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Postings</span>
                      <span className="text-sm font-bold text-slate-800">
                        {partner.activeInternships} Intern / {partner.activeJobs} Job
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Students Selected</span>
                      <span className="text-sm font-bold text-emerald-700">
                        {partner.selectedCandidates} / {partner.totalApplicants} App
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Internships Governance View */
          filteredInternships.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No active internships found</h3>
              <p className="text-xs text-slate-500 mt-1">No internships match your current filter.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Internship Opening</th>
                    <th className="py-3 px-4">Corporate Partner</th>
                    <th className="py-3 px-4">Stipend & Duration</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Applicants</th>
                    <th className="py-3 px-4">Selected</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInternships.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{item.title}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{item.companyName}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-700 font-semibold">{item.stipend}</span>
                        <span className="text-xs text-slate-400 block">{item.duration || '3 Months'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{item.location}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{item.totalApplicants || 0}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{item.selectedCount || 0}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            item.status === 'active' || item.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}

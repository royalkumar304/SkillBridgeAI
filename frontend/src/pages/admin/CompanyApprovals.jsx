import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Building, CheckCircle, XCircle, AlertCircle, RefreshCw, ShieldCheck, Briefcase } from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyApprovals() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminCompanies();
      if (res.success && res.data) {
        setCompanies(res.data.companies || []);
      } else {
        setError(res.message || 'Failed to fetch companies list');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message || 'Network error fetching companies');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (company) => {
    const newStatus = !company.verified;
    const confirmMsg = newStatus
      ? `Are you sure you want to approve "${company.name}"? This will allow them to publish live campus job postings.`
      : `Are you sure you want to revoke verification for "${company.name}"? They will no longer be able to publish new postings.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(company.id);
    setFeedback(null);

    try {
      const res = await api.verifyCompany(company.id, newStatus);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Verification status for "${company.name}" set to ${newStatus ? 'VERIFIED' : 'PENDING'}.`
        });
        // Update local state immediately
        setCompanies((prev) =>
          prev.map((c) => (c.id === company.id ? { ...c, verified: newStatus } : c))
        );
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to update verification status.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network error updating verification.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Corporate Partner Approvals</h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify and audit industry recruiters before they can publish jobs or internships to students.
            </p>
          </div>
          <button
            onClick={fetchCompanies}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Partners</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

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
            <p className="text-xs text-slate-500">Loading corporate partners and verification statuses...</p>
          </div>
        )}

        {/* Companies Table */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {companies.length === 0 ? (
              <div className="p-12 text-center">
                <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Corporate Partners Registered</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When recruiters register and create company profiles, their pending authorizations will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Company Information</th>
                      <th className="px-6 py-3.5 text-left">Recruiter Contact</th>
                      <th className="px-6 py-3.5 text-left">Verification Status</th>
                      <th className="px-6 py-3.5 text-left">Active Postings</th>
                      <th className="px-6 py-3.5 text-left">Registered Date</th>
                      <th className="px-6 py-3.5 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {companies.map((c) => {
                      const isPending = !c.verified;
                      const isActing = actionLoadingId === c.id;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-[11px] text-slate-500">{c.industry} • {c.location}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{c.recruiter?.name || 'Recruiter'}</div>
                            <div className="text-[11px] text-slate-500">{c.recruiter?.email || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {c.verified ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" />
                                Verified Partner
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600 mr-1" />
                                Pending Approval
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              <Briefcase className="w-3 h-3 text-slate-500 mr-1" />
                              {c.activeJobsCount} Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleToggleVerification(c)}
                              disabled={isActing}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors ${
                                isPending
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300'
                              } disabled:opacity-50`}
                            >
                              {isActing ? (
                                <span>Updating...</span>
                              ) : isPending ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Approve Partner</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Revoke Verification</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

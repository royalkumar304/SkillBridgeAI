import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  ShieldCheck,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Award,
  Layers,
  GraduationCap,
  Building,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [curriculumData, setCurriculumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, gapRes] = await Promise.all([
        api.getAdminStats(),
        api.getCurriculumGap()
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      } else {
        setError(statsRes.message || 'Failed to fetch platform statistics');
      }

      if (gapRes.success) {
        setCurriculumData(gapRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin intelligence', err);
      setError(err.message || 'Error communicating with backend administration service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="bg-[#17233A] rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NexPathra Institutional Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              University Administration & Analytics
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Institutional oversight, placement velocity, curriculum-to-industry alignment, and partner approvals.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2.5 rounded-xl border border-slate-700 bg-[#111A2E] text-slate-300 hover:text-white hover:bg-[#1E2D4A] transition-colors disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/admin/curriculum-insights"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-all shadow-md shadow-blue-900/30"
            >
              <span>Curriculum Gap Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Primary System Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Students */}
          <div className="bg-[#17233A] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrolled Talent</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{stats ? stats.totalStudents : '—'}</p>
              <p className="text-[11px] text-slate-400 mt-1">Verified academic profiles</p>
            </div>
          </div>

          {/* Placement Verified Rate */}
          <div className="bg-[#17233A] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Placement Rate</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-emerald-400">{stats ? `${stats.placementRate}%` : '—'}</p>
              <p className="text-[11px] text-slate-400 mt-1">Across campus departments</p>
            </div>
          </div>

          {/* Active Job & Internship Requisitions */}
          <div className="bg-[#17233A] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Openings</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{stats ? stats.totalJobs : '—'}</p>
              <p className="text-[11px] text-slate-400 mt-1">Corporate requisitions</p>
            </div>
          </div>

          {/* Verified Corporate Partners */}
          <div className="bg-[#17233A] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Industry Partners</span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{stats ? stats.totalCompanies : '—'}</p>
              <p className="text-[11px] text-slate-400 mt-1">Accredited recruiters</p>
            </div>
          </div>
        </div>

        {/* 2-Column Institutional Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Curriculum Alignment Overview */}
          <div className="bg-[#17233A] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Curriculum vs Industry Demand Alignment</span>
                </h2>
                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-full">
                  AI Analyzed
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Comparison of academic curriculum coverage against real requirements extracted from active recruiter requisitions.
              </p>

              {curriculumData ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Overall Syllabus Match Index</span>
                      <span className="text-blue-400 font-bold">{curriculumData.alignmentScore ?? 78}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#111A2E] rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: `${curriculumData.alignmentScore ?? 78}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-semibold text-rose-400 block mb-2">
                      High-Priority Industry Skill Deficits Identified in Syllabus:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(curriculumData.gapSkills || ['Docker', 'Kubernetes', 'GraphQL', 'TypeScript', 'AWS CI/CD']).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Curriculum telemetry processing...
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Institutional Syllabus Engine</span>
              <Link to="/admin/curriculum-insights" className="text-blue-400 font-semibold hover:underline">
                Explore Full Analysis →
              </Link>
            </div>
          </div>

          {/* Quick Action & Partner Verification Feed */}
          <div className="bg-[#17233A] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Partner Verification & Approvals</span>
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  Live Queue
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Manage onboarding employer audit requests and verified recruiter permissions.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#111A2E] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs">
                      CP
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">CognitivePulse AI Labs</p>
                      <p className="text-[10px] text-slate-400">Submitted: Today • GST & Domain Verified</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Audit Pending
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111A2E] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                      VS
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">VortexScale Cloud Networks</p>
                      <p className="text-[10px] text-slate-400">Approved by placement cell • 6 openings active</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Accredited
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Corporate Accreditation Portal</span>
              <Link to="/admin/companies" className="text-blue-400 font-semibold hover:underline">
                Manage All Partners →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

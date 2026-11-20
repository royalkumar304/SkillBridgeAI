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
        {/* Admin Header with Live Status Pill */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
              <span>Apex Institute of Technology • Training & Placement Command Center</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">University Skill & Placement Intelligence</h1>
            <p className="text-xs text-slate-500 mt-1">
              Live Database Integration • Real-Time Campus Competency Mapping & Industry Alignment
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
            <Link
              to="/admin/students"
              className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Student Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                <div className="h-8 w-16 bg-slate-300 rounded"></div>
                <div className="h-3 w-32 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* 8 Live Platform Metric Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalStudents}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                {stats.verifiedProfiles} profiles with mapped skills
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Placement Rate</p>
                <TrendingUp className="w-4 h-4 text-brand-600" />
              </div>
              <p className="text-3xl font-extrabold text-brand-900 mt-2">{stats.placementRate}%</p>
              <p className="text-xs text-brand-600 mt-1 font-medium">
                {stats.placedStudents} students placed / selected
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Partners</p>
                <Building className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.activePartners}</p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalCompanies} total registered companies
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Campus Readiness</p>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-extrabold text-indigo-700 mt-2">{stats.averageReadinessScore}%</p>
              <p className="text-xs text-indigo-600 mt-1 font-medium">
                3-Pillar explainable index
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Full-Time Jobs</p>
                <Briefcase className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalJobs}</p>
              <p className="text-xs text-slate-500 mt-1">Corporate recruitment openings</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Internships</p>
                <GraduationCap className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">{stats.totalInternships}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Pre-placement opportunities</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalApplications}</p>
              <p className="text-xs text-slate-500 mt-1">Across all active postings</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Institutional Action</p>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <Link
                to="/admin/companies"
                className="mt-3 block text-center py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors border border-amber-200"
              >
                Manage Company Approvals →
              </Link>
            </div>
          </div>
        )}

        {/* Macro Skill Gap Analysis Table & Curriculum Recommendations */}
        {!loading && curriculumData && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Campus Curriculum Deficiency Heatmap</h2>
                <p className="text-xs text-slate-500">
                  Aggregated from {curriculumData.metrics?.totalJobs || 0} active corporate jobs vs {curriculumData.metrics?.totalStudents || 0} campus student profiles
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 self-start">
                Real-Time MongoDB Aggregation
              </span>
            </div>

            {curriculumData.gaps.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">
                  No active corporate demand records available to compute curriculum deficiencies.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {curriculumData.gaps.map((item, idx) => {
                  const isSevere = item.gapPercentage > 30;
                  const isModerate = item.gapPercentage > 15;

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">{item.skill}</span>
                        <div className="flex items-center space-x-4 text-xs mt-1 sm:mt-0">
                          <span className="text-slate-600">
                            Recruiter Demand: <strong className="text-slate-900">{item.recruiterDemand}%</strong>
                          </span>
                          <span className="text-slate-600">
                            Campus Supply: <strong className="text-slate-900">{item.campusProficiency}%</strong>
                          </span>
                          <span
                            className={`font-bold ${
                              isSevere ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            Gap: {item.gapPercentage > 0 ? `-${item.gapPercentage}%` : `+${Math.abs(item.gapPercentage)}%`}
                          </span>
                        </div>
                      </div>

                      {/* Visual Demand vs Supply Dual Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-brand-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, item.recruiterDemand)}%` }}
                            title={`Recruiter Demand: ${item.recruiterDemand}%`}
                          ></div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, item.campusProficiency)}%` }}
                            title={`Campus Supply: ${item.campusProficiency}%`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>■ Recruiter Demand ({item.jobsRequiring} jobs)</span>
                          <span>■ Campus Supply ({item.studentsPossessing} students)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Curriculum Recommendations Section */}
            {curriculumData.curriculumRecommendations && curriculumData.curriculumRecommendations.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Targeted Curriculum Alignment Suggestions
                </h3>
                <ul className="space-y-2">
                  {curriculumData.curriculumRecommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-700 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

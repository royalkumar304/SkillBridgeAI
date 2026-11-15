import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { ShieldCheck, Users, Briefcase, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function AdminDashboard() {
  const inDemandGaps = [
    { skill: 'Docker & Containerization', industryDemand: 82, campusProficiency: 34, gap: 48 },
    { skill: 'FastAPI / Microservices', industryDemand: 76, campusProficiency: 41, gap: 35 },
    { skill: 'TypeScript', industryDemand: 88, campusProficiency: 58, gap: 30 },
    { skill: 'MongoDB Aggregation', industryDemand: 72, campusProficiency: 51, gap: 21 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Admin Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
              <span>Apex Institute of Technology • TPO Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">University Skill & Placement Intelligence</h1>
            <p className="text-xs text-slate-500 mt-1">
              Tracking 1,240 Enrolled Students • 48 Industry Partners • Real-Time Curriculum Alignment
            </p>
          </div>

          <button className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-sm">
            <span>Export AI Accreditation Report</span>
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students Mapped</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">1,240</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">94% profiles verified</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Placement Rate</p>
            <p className="text-3xl font-extrabold text-brand-900 mt-2">78.4%</p>
            <p className="text-xs text-brand-600 mt-1 font-medium">+12% vs last academic year</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Corporate Partners</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">48</p>
            <p className="text-xs text-slate-500 mt-1">11 new companies joined</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Campus Skill Readiness</p>
            <p className="text-3xl font-extrabold text-indigo-700 mt-2">74.2%</p>
            <p className="text-xs text-indigo-600 mt-1 font-medium">Full Stack & AI tracks</p>
          </div>
        </div>

        {/* Macro Skill Gap Analysis Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Curriculum Deficiency Heatmap</h2>
              <p className="text-xs text-slate-500">
                Skills required by recruiters vs verified campus student competencies
              </p>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Curriculum Intervention Recommended
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {inDemandGaps.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">{item.skill}</span>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-slate-600">Recruiter Demand: <strong className="text-slate-900">{item.industryDemand}%</strong></span>
                    <span className="text-slate-600">Campus Score: <strong className="text-slate-900">{item.campusProficiency}%</strong></span>
                    <span className="font-bold text-rose-600">Gap: -{item.gap}%</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-indigo-600 h-full" style={{ width: `${item.campusProficiency}%` }}></div>
                  <div className="bg-rose-400 h-full" style={{ width: `${item.gap}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


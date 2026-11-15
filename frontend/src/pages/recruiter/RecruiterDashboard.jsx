import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import { Building2, Plus, Users, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';

export default function RecruiterDashboard() {
  const [activeJobFilter, setActiveJobFilter] = useState('all');

  const applicants = [
    {
      id: 1,
      name: 'Arjun Sharma',
      university: 'Apex Institute of Technology',
      role: 'Frontend Developer Intern',
      cgpa: 8.4,
      matchScore: 92,
      skills: ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
      status: 'Shortlisted',
    },
    {
      id: 2,
      name: 'Sneha Patel',
      university: 'National College of Engineering',
      role: 'Frontend Developer Intern',
      cgpa: 8.9,
      matchScore: 85,
      skills: ['React', 'CSS', 'HTML', 'JavaScript'],
      status: 'Under Review',
    },
    {
      id: 3,
      name: 'Rohan Verma',
      university: 'Metro State University',
      role: 'Backend Node.js Intern',
      cgpa: 7.2,
      matchScore: 68,
      skills: ['Node.js', 'Express', 'MongoDB'],
      status: 'Applied',
    },
  ];

  return (
    <RecruiterLayout>
      <div className="space-y-8">
        {/* Recruiter Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>SkillBridge Industry Recruiter Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Applicant Pipeline & Job Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Active Listings: 3 • Total Applicants: 48 • Auto-Ranked via SkillBridge Match Engine
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/recruiter/jobs"
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Manage Openings</span>
            </Link>
            <Link
              to="/recruiter/jobs/create"
              className="px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Opportunity</span>
            </Link>
          </div>
        </div>

        {/* Quick Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Openings</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">3</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">All applications open</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidates Above 80% Match</p>
            <p className="text-3xl font-extrabold text-indigo-700 mt-2">24</p>
            <p className="text-xs text-slate-500 mt-1">Pre-filtered by AI</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Interviews</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">8</p>
            <p className="text-xs text-indigo-600 mt-1 font-medium">Next: Tomorrow 11:00 AM</p>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Applicant Submissions</h2>
              <p className="text-xs text-slate-500">Sorted by Explainable Match Score</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by skill or name..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Candidate</th>
                  <th className="py-3 px-6">Opportunity</th>
                  <th className="py-3 px-6">CGPA</th>
                  <th className="py-3 px-6">Match Score</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{app.name}</p>
                      <p className="text-[11px] text-slate-500">{app.university}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.skills.map((s, i) => (
                          <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{app.role}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{app.cgpa}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold ${
                        app.matchScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.matchScore}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-semibold text-slate-700">{app.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button className="px-3 py-1 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold">
                        Shortlist
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
}


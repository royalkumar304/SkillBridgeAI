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
        <div className="bg-[#17233A] rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2.5 border border-blue-500/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>NexPathra Corporate Recruiter Desk</span>
            </div>
            <h1 className="text-2xl font-black text-white">Applicant Pipeline & Job Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Listings: 3 • Total Applicants: 48 • Auto-Ranked via NexPathra Match Engine
            </p>
          </div>

          <div className="flex gap-2.5">
            <Link
              to="/recruiter/jobs"
              className="px-4 py-2.5 border border-slate-700 bg-[#111A2E] hover:bg-[#1E2D4A] text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
            >
              <span>Manage Openings</span>
            </Link>
            <Link
              to="/recruiter/jobs/create"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-all shadow-md shadow-blue-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Opportunity</span>
            </Link>
          </div>
        </div>

        {/* Quick Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#17233A] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Openings</p>
            <p className="text-3xl font-black text-white mt-2">3</p>
            <p className="text-xs text-emerald-400 mt-1 font-medium">All applications open</p>
          </div>
          <div className="bg-[#17233A] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidates Above 80% Match</p>
            <p className="text-3xl font-black text-blue-400 mt-2">24</p>
            <p className="text-xs text-slate-400 mt-1">Pre-filtered by AI</p>
          </div>
          <div className="bg-[#17233A] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Interviews</p>
            <p className="text-3xl font-black text-indigo-400 mt-2">8</p>
            <p className="text-xs text-indigo-300 mt-1 font-medium">Next: Tomorrow 11:00 AM</p>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Applicant Submissions</h2>
              <p className="text-xs text-slate-400">Sorted by Explainable Match Score</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by skill or name..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#111A2E] border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111A2E] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6">Candidate</th>
                  <th className="py-3 px-6">Opportunity</th>
                  <th className="py-3 px-6">CGPA</th>
                  <th className="py-3 px-6">Match Score</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-[#1E2D4A]/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white">{app.name}</p>
                      <p className="text-[11px] text-slate-400">{app.university}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.skills.map((s, i) => (
                          <span key={i} className="text-[9px] bg-[#111A2E] text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">{app.role}</td>
                    <td className="py-4 px-6 font-semibold text-slate-200">{app.cgpa}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold ${
                        app.matchScore >= 80
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {app.matchScore}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-semibold text-slate-300">{app.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all">
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

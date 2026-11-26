import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0B1020] border-t border-slate-800/80 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-black text-white">Nex<span className="text-blue-400">Pathra</span></span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4">
              Where Skills Meet Opportunity. An enterprise AI intelligence platform bridging students, recruiters, and university administrators.
            </p>
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} NexPathra. All rights reserved.
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/student/dashboard" className="hover:text-blue-400 transition-colors">Student Hub</a></li>
              <li><a href="/recruiter/dashboard" className="hover:text-blue-400 transition-colors">Recruiter Portal</a></li>
              <li><a href="/admin/dashboard" className="hover:text-blue-400 transition-colors">University Admin</a></li>
              <li><a href="/jobs" className="hover:text-blue-400 transition-colors">Explore Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Intelligence</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/career-readiness" className="hover:text-blue-400 transition-colors">Readiness Scoring</a></li>
              <li><a href="/skill-gap" className="hover:text-blue-400 transition-colors">Skill Gap Matrix</a></li>
              <li><a href="/internships" className="hover:text-blue-400 transition-colors">Internship Engine</a></li>
              <li><a href="/learning-recommendations" className="hover:text-blue-400 transition-colors">Curated Learning</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

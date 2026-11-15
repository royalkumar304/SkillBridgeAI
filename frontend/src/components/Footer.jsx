import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 text-white font-bold text-lg mb-3">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>SkillBridge AI</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Academia–Industry Collaboration Platform for Intelligent Skill Mapping, Internships, and Placement Discovery.
              Developed for Smart India Hackathon 2026 (SIH26044).
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">Portals</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/student/dashboard" className="hover:text-white transition-colors">Student Hub</a></li>
              <li><a href="/recruiter/dashboard" className="hover:text-white transition-colors">Recruiter Desk</a></li>
              <li><a href="/admin/dashboard" className="hover:text-white transition-colors">University Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">Tech Foundation</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>React + Vite (5173)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span><span>Express API (5000)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400"></span><span>FastAPI AI (8000)</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 SkillBridge AI Team. Built for SIH 2026.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Modular MERN + Python Microservice Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
}


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ArrowRight, CheckCircle2, GraduationCap, Building2, ShieldCheck, Sparkles, BarChart3, Target, Briefcase, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [aiStatus, setAiStatus] = useState('checking');

  useEffect(() => {
    // Check backend health
    api.checkBackendHealth()
      .then((data) => setBackendStatus(data.status === 'UP' ? 'online' : 'degraded'))
      .catch(() => setBackendStatus('offline'));

    // Check AI microservice health
    api.checkAiHealth()
      .then((data) => setAiStatus(data.status === 'HEALTHY' ? 'online' : 'degraded'))
      .catch(() => setAiStatus('offline'));
  }, []);

  return (
    <MainLayout>
      {/* Top Banner */}
      <div className="bg-[#111A2E] text-slate-300 py-2.5 px-4 text-center text-xs border-b border-slate-800/80 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span className="font-semibold text-blue-400">NexPathra Intelligence:</span>
        <span className="text-slate-400">Where Skills Meet Opportunity &bull; Academia–Industry Synergy Platform</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-36 bg-[#0B1020]">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-violet-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Live Service Status Indicator */}
            <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-[#111A2E]/90 border border-slate-800 text-xs text-slate-300 mb-8 backdrop-blur-md shadow-lg shadow-black/20">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="font-medium text-slate-400">Core API: <strong className="text-white font-semibold">{backendStatus}</strong></span>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${aiStatus === 'online' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="font-medium text-slate-400">AI Engine: <strong className="text-white font-semibold">{aiStatus}</strong></span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Where Skills Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">Opportunity</span>
            </h1>

            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              An enterprise AI intelligence platform bridging students, recruiters, and university administrators. Evaluate real-time career readiness, bridge skill gaps, and match talent with precision.
            </p>

            {/* Call to Actions */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-900/40 transition-all hover:-translate-y-0.5"
              >
                <span>Explore Student Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/recruiter/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-200 bg-[#17233A] hover:bg-[#1E2D4A] border border-slate-700/80 transition-all hover:-translate-y-0.5"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Recruiter Portal</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Skill Gap Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Strict RBAC Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Institutional Alignment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-[#111A2E] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Tri-Party Synergy</h2>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">Built for Academia, Industry & Talent</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="bg-[#17233A] p-8 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Students</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Understand exact career readiness scores, analyze skill gaps for dream roles, access tailored learning recommendations, and discover verified internships.
              </p>
              <Link to="/student/dashboard" className="text-sm font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center space-x-1">
                <span>Access Student Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Recruiter Card */}
            <div className="bg-[#17233A] p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Recruiters</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Post high-precision job & internship requisitions, review candidates with computed readiness indices, and connect directly with campus talent pipelines.
              </p>
              <Link to="/recruiter/dashboard" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1">
                <span>Explore Recruiter Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* University Admin Card */}
            <div className="bg-[#17233A] p-8 rounded-2xl border border-slate-800 hover:border-violet-500/40 transition-all shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For University Admins</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Track department placement velocity, identify curriculum misalignment against active market demands, and approve verified corporate partners.
              </p>
              <Link to="/admin/dashboard" className="text-sm font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center space-x-1">
                <span>View Admin Insights</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Capabilities Grid */}
      <section className="py-20 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Platform Intelligence</h2>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">Deterministic Career Analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#17233A] border border-slate-800">
              <BarChart3 className="w-6 h-6 text-blue-400 mb-4" />
              <h4 className="font-bold text-white mb-2">Readiness Index</h4>
              <p className="text-xs text-slate-400">Algorithmic scoring combining technical competencies, education, and verified projects.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#17233A] border border-slate-800">
              <Target className="w-6 h-6 text-indigo-400 mb-4" />
              <h4 className="font-bold text-white mb-2">Skill Gap Matrix</h4>
              <p className="text-xs text-slate-400">Precision gap breakdown across core and secondary skills for target career paths.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#17233A] border border-slate-800">
              <Zap className="w-6 h-6 text-cyan-400 mb-4" />
              <h4 className="font-bold text-white mb-2">Curated Bridge</h4>
              <p className="text-xs text-slate-400">Actionable learning paths and high-yield resources mapped to missing skills.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#17233A] border border-slate-800">
              <Briefcase className="w-6 h-6 text-violet-400 mb-4" />
              <h4 className="font-bold text-white mb-2">Verified Internships</h4>
              <p className="text-xs text-slate-400">Real-time stipend and duration tracked early-career opportunities.</p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

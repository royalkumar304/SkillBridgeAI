import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Sparkles, ArrowRight, CheckCircle2, Cpu, GraduationCap, Building2, ShieldCheck, Activity } from 'lucide-react';
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
      <div className="bg-brand-900 text-slate-200 py-2.5 px-4 text-center text-xs border-b border-brand-800">
        <span className="font-semibold text-brand-300">Smart India Hackathon 2026:</span> SIH26044 — Portal for Academia - Industry collaboration for Skill Mapping, Internships & Placement
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Status Pills */}
            <div className="inline-flex items-center space-x-3 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 mb-8">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="font-medium">Backend API: {backendStatus}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${aiStatus === 'online' ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="font-medium">AI Service: {aiStatus}</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-900 tracking-tight leading-tight">
              Bridging Academic Learning with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 to-indigo-600">Industry Reality</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              SkillBridge AI automatically maps student competencies, uncovers real-world skill gaps, recommends targeted career roadmaps, and matches students to verified industry internships.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 shadow-md shadow-brand-900/20 transition-all hover:-translate-y-0.5"
              >
                <span>Launch Student Demo</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Triple Stakeholder Architecture</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-900">One Platform. Three Beneficiaries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Students</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Upload resumes to extract verified skills, benchmark against current job postings, and receive curated training roadmaps to close missing gaps.
              </p>
              <Link to="/student/dashboard" className="text-xs font-bold text-brand-700 hover:text-brand-900 inline-flex items-center">
                Explore Student Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Recruiter */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Industry Recruiters</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Post internships with custom skill weights and eligibility criteria. View explainable matching scores without parsing thousands of irrelevant resumes.
              </p>
              <Link to="/recruiter/dashboard" className="text-xs font-bold text-brand-700 hover:text-brand-900 inline-flex items-center">
                Explore Recruiter Desk <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* University */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Universities</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Gain macro-level visibility into student competencies, campus placement rates, and emerging industry demands to update academic syllabi.
              </p>
              <Link to="/admin/dashboard" className="text-xs font-bold text-brand-700 hover:text-brand-900 inline-flex items-center">
                Explore Admin Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}


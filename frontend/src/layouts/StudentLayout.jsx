import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { User, FileText, Target, Briefcase, BookOpen, Sparkles } from 'lucide-react';

export default function StudentLayout({ children }) {
  const navItems = [
    { label: 'Overview', to: '/student/dashboard', icon: Target, end: true },
    { label: 'My Profile', to: '/student/profile', icon: User },
    { label: 'Full-Time Jobs', to: '/student/jobs', icon: Briefcase },
    { label: 'Internship Board', to: '/student/internships', icon: Briefcase, badge: 'New' },
    { label: 'My Applications', to: '/student/applications', icon: FileText },
    { label: 'Career Intelligence', to: '/student/career/readiness', icon: Sparkles, badge: 'AI' },
    { label: 'Skill Gap Breakdown', to: '/student/career/gap', icon: Target },
    { label: 'Learning Roadmap', to: '/student/career/recommendations', icon: BookOpen },
    { label: 'Job-Wise Analysis', to: '/student/career/jobs', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex border-x border-slate-800/80">
        <Sidebar title="Student Hub" roleLabel="Student" items={navItems} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0B1020]">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

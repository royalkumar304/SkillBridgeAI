import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { User, FileText, Target, Briefcase, BookOpen, Sparkles } from 'lucide-react';

export default function StudentLayout({ children }) {
  const navItems = [
    { label: 'Overview', to: '/student/dashboard', icon: Target, end: true },
    { label: 'My Profile', to: '/student/profile', icon: User },
    { label: 'Browse Opportunities', to: '/student/jobs', icon: Briefcase },
    { label: 'My Applications', to: '/student/applications', icon: FileText },
    { label: 'Skills & Gap Report', to: '/student/dashboard', icon: Sparkles, badge: 'AI' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar title="Student Portal" roleLabel="Student" items={navItems} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}


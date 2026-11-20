import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { ShieldCheck, GraduationCap, Building, PieChart, FileSpreadsheet, Settings, Briefcase, Brain, Users } from 'lucide-react';

export default function AdminLayout({ children }) {
  const navItems = [
    { label: 'University Overview', to: '/admin/dashboard', icon: ShieldCheck, end: true },
    { label: 'Student Directory', to: '/admin/students', icon: GraduationCap, badge: 'Live' },
    { label: 'Company Approvals', to: '/admin/companies', icon: Building },
    { label: 'Industry Partners & Internships', to: '/admin/partners', icon: Briefcase, badge: 'Hub' },
    { label: 'Curriculum Insights', to: '/admin/curriculum-insights', icon: Brain, badge: 'AI' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar title="Administration" roleLabel="University Admin" items={navItems} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}


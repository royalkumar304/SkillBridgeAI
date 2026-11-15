import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { ShieldCheck, GraduationCap, Building, PieChart, FileSpreadsheet, Settings } from 'lucide-react';

export default function AdminLayout({ children }) {
  const navItems = [
    { label: 'University Overview', to: '/admin/dashboard', icon: ShieldCheck, end: true },
    { label: 'Student Skill Analytics', to: '/admin/dashboard', icon: GraduationCap, badge: 'Insights' },
    { label: 'Partner Companies', to: '/admin/dashboard', icon: Building },
    { label: 'Placement Performance', to: '/admin/dashboard', icon: PieChart },
    { label: 'Curriculum Gap Reports', to: '/admin/dashboard', icon: FileSpreadsheet },
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


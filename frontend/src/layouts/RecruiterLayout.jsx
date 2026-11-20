import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Building2, PlusCircle, Users, CheckSquare, BarChart, Briefcase, Building } from 'lucide-react';

export default function RecruiterLayout({ children }) {
  const navItems = [
    { label: 'Pipeline Overview', to: '/recruiter/dashboard', icon: Building2, end: true },
    { label: 'Manage Jobs', to: '/recruiter/jobs', icon: CheckSquare },
    { label: 'Manage Internships', to: '/recruiter/internships', icon: Briefcase, badge: 'Live' },
    { label: 'Post Opportunity', to: '/recruiter/jobs/create', icon: PlusCircle },
    { label: 'Company Profile', to: '/recruiter/profile', icon: Building },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar title="Recruiter Desk" roleLabel="Industry Partner" items={navItems} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}


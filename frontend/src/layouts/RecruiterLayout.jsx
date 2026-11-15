import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Building2, PlusCircle, Users, CheckSquare, BarChart } from 'lucide-react';

export default function RecruiterLayout({ children }) {
  const navItems = [
    { label: 'Recruiter Dashboard', to: '/recruiter/dashboard', icon: Building2, end: true },
    { label: 'Post Opportunity', to: '/recruiter/dashboard', icon: PlusCircle },
    { label: 'Candidate Shortlists', to: '/recruiter/dashboard', icon: Users, badge: 'Matching' },
    { label: 'Interview Scheduler', to: '/recruiter/dashboard', icon: CheckSquare },
    { label: 'Placement Pipeline', to: '/recruiter/dashboard', icon: BarChart },
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


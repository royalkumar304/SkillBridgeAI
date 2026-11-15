import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Building2, PlusCircle, Users, CheckSquare, BarChart } from 'lucide-react';

export default function RecruiterLayout({ children }) {
  const navItems = [
    { label: 'Pipeline Overview', to: '/recruiter/dashboard', icon: Building2, end: true },
    { label: 'Manage Opportunities', to: '/recruiter/jobs', icon: CheckSquare },
    { label: 'Post Opportunity', to: '/recruiter/jobs/create', icon: PlusCircle },
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


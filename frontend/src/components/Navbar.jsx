import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import NexPathraLogo from './NexPathraLogo';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getRoleDashboard } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1020]/90 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* NexPathra Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <NexPathraLogo size="md" showTagline={false} />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Home</Link>
            <Link to="/student/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Student Hub</Link>
            <Link to="/recruiter/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Recruiters</Link>
            <Link to="/admin/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">University Admin</Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <NotificationDropdown />
                <Link
                  to={getRoleDashboard(user.role)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#17233A] text-slate-200 border border-slate-700/60 hover:bg-[#1E2D4A] hover:border-blue-500/50 transition-all shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>{user.name?.split(' ')[0] || 'User'} ({user.role})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-lg shadow-md shadow-blue-900/30 transition-all hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

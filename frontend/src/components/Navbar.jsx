import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getRoleDashboard } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-900 to-brand-800 flex items-center justify-center text-white shadow-md shadow-brand-900/10 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-brand-900">SkillBridge <span className="text-brand-600">AI</span></span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-600 uppercase">SIH 2026 • SIH26044</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-900 transition-colors">Home</Link>
            <Link to="/student/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-900 transition-colors">Student Hub</Link>
            <Link to="/recruiter/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-900 transition-colors">Recruiters</Link>
            <Link to="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-900 transition-colors">University Admin</Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <NotificationDropdown />
                <Link
                  to={getRoleDashboard(user.role)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-800 hover:bg-brand-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{user.name.split(' ')[0]} ({user.role})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 rounded-lg shadow-sm shadow-brand-900/20 transition-all hover:-translate-y-0.5"
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

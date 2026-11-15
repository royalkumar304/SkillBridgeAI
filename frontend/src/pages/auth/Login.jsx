import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { Sparkles, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getRoleDashboard } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success && result.user) {
        const dest = from || getRoleDashboard(result.user.role);
        navigate(dest, { replace: true });
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Backend service connection failure. Please ensure the Express server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role, email) => {
    setFormData({
      email,
      password: 'Password123!',
    });
  };

  return (
    <MainLayout>
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-brand-50 text-brand-900 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-brand-600" />
            </div>
            <h2 className="text-2xl font-bold text-brand-900">Sign in to SkillBridge</h2>
            <p className="text-xs text-slate-500 mt-1">SIH 2026 Academia–Industry Portal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@university.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Test Autofill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('STUDENT', 'student@demo.com')}
                className="text-[11px] py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('RECRUITER', 'recruiter@demo.com')}
                className="text-[11px] py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700"
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('ADMIN', 'admin@demo.com')}
                className="text-[11px] py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-900">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Bell, Check, CheckCheck, Trash2, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    fetchNotifications(1);
  }, [unreadOnly]);

  const fetchNotifications = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getNotifications({
        page: pageToLoad,
        limit: 15,
        unreadOnly: unreadOnly ? 'true' : '',
      });

      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setPagination({
          page: res.data.page || 1,
          limit: res.data.limit || 15,
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        });
      } else {
        setError(res.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Unable to communicate with notification service.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    setActingId(id);
    try {
      const res = await api.markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.warn('Failed to mark read', err);
    } finally {
      setActingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.warn('Failed to mark all read', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    setActingId(id);
    try {
      const res = await api.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.warn('Failed to delete notification', err);
    } finally {
      setActingId(null);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Notifications</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time updates regarding your job applications, profile matches, and corporate approvals.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchNotifications(pagination.page)}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-900 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors border border-brand-200"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600">Filter:</span>
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                !unreadOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                unreadOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread Only
            </button>
          </div>

          <span className="text-slate-400 text-[11px]">
            {pagination.total} total notification{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin h-7 w-7 border-4 border-brand-800 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Querying your notification feed...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No Notifications Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {unreadOnly
                    ? 'You have read all of your notifications. Switch filter to "All Notifications" to view your history.'
                    : 'Your notification inbox is currently clear.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`p-5 transition-colors flex items-start justify-between space-x-4 ${
                    !item.isRead ? 'bg-indigo-50/30' : 'bg-white'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{item.message}</p>
                    <p className="text-[11px] text-slate-400 pt-1">{formatRelativeTime(item.createdAt)}</p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        disabled={actingId === item._id}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-brand-800 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={actingId === item._id}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

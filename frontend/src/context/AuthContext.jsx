import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session by verifying cookie with the backend
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const res = await api.getProfile();
        if (isMounted) {
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    // Listen for global session expiration events triggered by HTTP 401
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('skillbridge:session_expired', handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('skillbridge:session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      const { user: authUser } = res.data;
      // Store user info strictly in React state (no localStorage persistence)
      setUser(authUser);
      return { success: true, user: authUser };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name, email, password, role) => {
    const res = await api.register({ name, email, password, role });
    if (res.success && res.data) {
      const { user: authUser } = res.data;
      setUser(authUser);
      return { success: true, user: authUser };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
  };

  const getRoleDashboard = (role) => {
    switch (role) {
      case 'RECRUITER':
        return '/recruiter/dashboard';
      case 'UNIVERSITY_ADMIN':
        return '/admin/dashboard';
      case 'STUDENT':
      default:
        return '/student/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        getRoleDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

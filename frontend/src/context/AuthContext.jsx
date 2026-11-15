import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to parse JWT payload without external library
  const parseJwt = (jwtToken) => {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const isTokenExpired = (jwtToken) => {
    const payload = parseJwt(jwtToken);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      if (isTokenExpired(storedToken)) {
        console.warn('[AuthContext] Stored session expired. Logging out.');
        logout();
      } else {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      const { user: authUser, token: authToken } = res.data;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));
      setToken(authToken);
      setUser(authUser);
      return { success: true, user: authUser };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name, email, password, role) => {
    const res = await api.register({ name, email, password, role });
    if (res.success && res.data) {
      const { user: authUser, token: authToken } = res.data;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));
      setToken(authToken);
      setUser(authUser);
      return { success: true, user: authUser };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
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
        token,
        loading,
        isAuthenticated: !!token && !isTokenExpired(token),
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

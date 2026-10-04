import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import socketService from '../services/socket';
import { User, UserRole } from '../types/user';
import { getErrorMessage } from '../i18n/errors';
import i18n, { isLanguage } from '../i18n';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: User }>;
  /** Creates the account and emails a 6-digit code; no session until verifyEmail. */
  register: (data: RegisterData) => Promise<void>;
  /** `password` becomes the account password: whoever proves the inbox sets it. */
  verifyEmail: (email: string, code: string, password: string) => Promise<{ user: User }>;
  resendCode: (email: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // /auth/login and /auth/verify-email answer with { user, accessToken, refreshToken }.
  const startSession = (data: { user: User; accessToken: string; refreshToken: string }) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return { user: data.user };
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      return startSession(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  // The code email is written in the interface language.
  const mailLanguage = () => (isLanguage(i18n.language) ? i18n.language : undefined);

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      await api.post('/auth/register', { ...data, language: mailLanguage() });
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const verifyEmail = async (email: string, code: string, password: string) => {
    const response = await api.post('/auth/verify-email', { email, code, password });
    return startSession(response.data);
  };

  const resendCode = async (email: string) => {
    await api.post('/auth/resend-code', { email, language: mailLanguage() });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Drop the previous user's cached data and live socket so the next login
    // on this browser never sees it.
    socketService.disconnect();
    queryClient.clear();
    setUser(null);
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      await api.delete('/auth/account');
      // After successful deletion, log the user out
      logout();
      return;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (err: any) {
      console.error('Failed to refresh user data:', err);
      throw err;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    verifyEmail,
    resendCode,
    logout,
    deleteAccount,
    isAuthenticated: !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

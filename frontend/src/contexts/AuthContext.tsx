import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import socketService from '../services/socket';
import { User, UserRole } from '../types/user';
import { getErrorMessage } from '../i18n/errors';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (data: RegisterData) => Promise<void>;
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

  // Both /auth/login and /auth/register answer with { user, accessToken, refreshToken }.
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

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', data);
      startSession(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
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
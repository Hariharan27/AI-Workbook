import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socketService';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  isVerified: boolean;
  isPrivate: boolean;
  isActive: boolean;
  lastSeen: string;
  stats?: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    profileViews: number;
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      allowMessages: 'everyone' | 'friends' | 'none';
    };
    language: 'en' | 'ta' | 'hi';
    theme: 'light' | 'dark' | 'auto';
  };
  createdAt: string;
  updatedAt: string;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getProfile();
          setUser(userData);
          // Connect to socket service
          socketService.connect(token);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, password });
      
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
      
      // Connect to socket service after successful login
      socketService.connect(response.token);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
      
      // Connect to socket service after successful registration
      socketService.connect(response.token);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Disconnect from socket service
    socketService.disconnect();
    
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to send reset email';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    forgotPassword,
    logout,
    loading,
    error,
    clearError,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { authAPI, AuthResponse, LoginData, RegisterData, ForgotPasswordData } from '../services/api';
import { getUserFromToken, isTokenExpired } from '../utils/jwt';

// Types
interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isPrivate: boolean;
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          dispatch({ type: 'AUTH_START' });
          
          // First, check if the access token is still valid
          if (!isTokenExpired(accessToken)) {
            // Token is valid, get user info from token
            const userInfo = getUserFromToken(accessToken);
            if (userInfo) {
              // Try to get full user profile from backend
              try {
                const profileResponse = await authAPI.getProfile();
                dispatch({ type: 'AUTH_SUCCESS', payload: profileResponse.data.user });
                return;
              } catch (profileError) {
                               // If profile fetch fails, use basic info from token
               console.warn('Failed to fetch profile, using token data:', profileError);
               if (userInfo.userId && userInfo.username && userInfo.email) {
                 const basicUser: User = {
                   _id: userInfo.userId,
                   username: userInfo.username,
                   email: userInfo.email,
                   firstName: '', // Will be filled by profile fetch
                   lastName: '', // Will be filled by profile fetch
                   avatar: '',
                   bio: '',
                   isVerified: userInfo.isVerified || false,
                   isPrivate: false,
                   stats: {
                     followersCount: 0,
                     followingCount: 0,
                     postsCount: 0
                   }
                 };
                 dispatch({ type: 'AUTH_SUCCESS', payload: basicUser });
               } else {
                 throw new Error('Invalid user info in token');
               }
                return;
              }
            }
          }
          
          // Access token is expired, try to refresh
          const response = await authAPI.refreshToken(refreshToken);
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;
          
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Get user profile with new token
          try {
            const profileResponse = await authAPI.getProfile();
            dispatch({ type: 'AUTH_SUCCESS', payload: profileResponse.data.user });
          } catch (profileError) {
                         // If profile fetch fails, use basic info from new token
             const userInfo = getUserFromToken(newAccessToken);
             if (userInfo && userInfo.userId && userInfo.username && userInfo.email) {
               const basicUser: User = {
                 _id: userInfo.userId,
                 username: userInfo.username,
                 email: userInfo.email,
                 firstName: '',
                 lastName: '',
                 avatar: '',
                 bio: '',
                 isVerified: userInfo.isVerified || false,
                 isPrivate: false,
                 stats: {
                   followersCount: 0,
                   followingCount: 0,
                   postsCount: 0
                 }
               };
               dispatch({ type: 'AUTH_SUCCESS', payload: basicUser });
             } else {
               throw new Error('Failed to decode user info from token');
             }
          }
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = useCallback(async (data: LoginData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response: AuthResponse = await authAPI.login(data);
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      // Set user data
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response: AuthResponse = await authAPI.register(data);
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      // Set user data
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }, []);

  // Forgot password function
  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    try {
      const response = await authAPI.forgotPassword(data);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to send reset email';
      throw new Error(errorMessage);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout API fails, clear local storage
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Update state
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    forgotPassword,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
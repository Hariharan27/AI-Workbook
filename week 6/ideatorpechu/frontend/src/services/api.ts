import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
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
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
  };
}

// Auth API Service
export const authAPI = {
  // Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (data: ForgotPasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Refresh Token
  refreshToken: async (refreshToken: string): Promise<{ success: boolean; data: { tokens: { accessToken: string; refreshToken: string } } }> => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Get Profile
  getProfile: async (): Promise<{ success: boolean; data: { user: any } }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// User API Service
export const userAPI = {
  // Get current user profile
  getProfile: async (): Promise<{ success: boolean; data: { user: any } }> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: any): Promise<{ success: boolean; data: { user: any } }> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

export default api; 
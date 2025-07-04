import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
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
  joinedDate: string;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

export interface Post {
  _id: string;
  content: string;
  author: User;
  media?: string[];
  hashtags?: string[];
  mentions?: User[];
  location?: string;
  isPublic: boolean;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  post: string;
  parentComment?: string;
  replies?: Comment[];
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hashtag {
  _id: string;
  name: string;
  description?: string;
  postsCount: number;
  followersCount: number;
  isFollowing: boolean;
  trending: boolean;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface SearchResult {
  _id: string;
  type: 'user' | 'hashtag' | 'post';
  title: string;
  subtitle?: string;
  avatar?: string;
  count?: number;
  content?: string;
  author?: User;
  hashtags?: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  isLiked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth API
export const authAPI = {
  register: async (userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> => {
    const response: AxiosResponse<{ success: boolean; data: { user: User; tokens: { accessToken: string } }; message: string }> = await api.post('/auth/register', userData);
    return {
      token: response.data.data.tokens.accessToken,
      user: response.data.data.user
    };
  },

  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
    const response: AxiosResponse<{ success: boolean; data: { user: User; tokens: { accessToken: string } }; message: string }> = await api.post('/auth/login', credentials);
    return {
      token: response.data.data.tokens.accessToken,
      user: response.data.data.user
    };
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/auth/forgot-password', { email });
    return { message: response.data.message };
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<{ success: boolean; data: { user: User }; message: string }> = await api.get('/auth/profile');
    return response.data.data.user;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response: AxiosResponse<User> = await api.put('/auth/profile', userData);
    return response.data;
  },

  changePassword: async (passwords: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.put('/auth/change-password', passwords);
    return response.data;
  }
};

// Posts API
export const postsAPI = {
  getFeed: async (page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { posts: Post[]; total: number; hasMore: boolean }; message: string }> = await api.get('/posts/feed', {
      params: { page, limit }
    });
    return response.data.data;
  },

  getPost: async (postId: string): Promise<Post> => {
    const response: AxiosResponse<{ success: boolean; data: { post: Post }; message: string }> = await api.get(`/posts/${postId}`);
    return response.data.data.post;
  },

  createPost: async (postData: {
    content: string;
    media?: File[];
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    isPublic: boolean;
  }): Promise<Post> => {
    const formData = new FormData();
    formData.append('content', postData.content);
    formData.append('isPublic', postData.isPublic.toString());
    
    if (postData.media) {
      postData.media.forEach(file => formData.append('media', file));
    }
    
    if (postData.hashtags) {
      formData.append('hashtags', JSON.stringify(postData.hashtags));
    }
    
    if (postData.mentions) {
      formData.append('mentions', JSON.stringify(postData.mentions));
    }
    
    if (postData.location) {
      formData.append('location', postData.location);
    }

    const response: AxiosResponse<{ success: boolean; data: { post: Post }; message: string }> = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data.post;
  },

  updatePost: async (postId: string, postData: Partial<Post>): Promise<Post> => {
    const response: AxiosResponse<Post> = await api.put(`/posts/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  likePost: async (postId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  sharePost: async (postId: string, shareData?: { message?: string }): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/posts/${postId}/share`, shareData);
    return response.data;
  }
};

// Comments API
export const commentsAPI = {
  getComments: async (postId: string, page = 1, limit = 10): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ comments: Comment[]; total: number; hasMore: boolean }> = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
    return response.data;
  },

  createComment: async (postId: string, commentData: { content: string; parentComment?: string }): Promise<Comment> => {
    const response: AxiosResponse<Comment> = await api.post(`/posts/${postId}/comments`, commentData);
    return response.data;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response: AxiosResponse<Comment> = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  likeComment: async (commentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  unlikeComment: async (commentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/comments/${commentId}/like`);
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getUser: async (userId: string): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/users/${userId}`);
    return response.data;
  },

  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ posts: Post[]; total: number; hasMore: boolean }> = await api.get(`/users/${userId}/posts`, {
      params: { page, limit }
    });
    return response.data;
  },

  followUser: async (userId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  getFollowers: async (userId: string, page = 1, limit = 20): Promise<{ users: User[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ users: User[]; total: number; hasMore: boolean }> = await api.get(`/users/${userId}/followers`, {
      params: { page, limit }
    });
    return response.data;
  },

  getFollowing: async (userId: string, page = 1, limit = 20): Promise<{ users: User[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ users: User[]; total: number; hasMore: boolean }> = await api.get(`/users/${userId}/following`, {
      params: { page, limit }
    });
    return response.data;
  }
};

// Hashtags API
export const hashtagsAPI = {
  getHashtag: async (hashtagName: string): Promise<Hashtag> => {
    const response: AxiosResponse<Hashtag> = await api.get(`/hashtags/${hashtagName}`);
    return response.data;
  },

  getHashtagPosts: async (hashtagName: string, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ posts: Post[]; total: number; hasMore: boolean }> = await api.get(`/hashtags/${hashtagName}/posts`, {
      params: { page, limit }
    });
    return response.data;
  },

  followHashtag: async (hashtagName: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/hashtags/${hashtagName}/follow`);
    return response.data;
  },

  unfollowHashtag: async (hashtagName: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/hashtags/${hashtagName}/follow`);
    return response.data;
  },

  getTrendingHashtags: async (): Promise<Hashtag[]> => {
    const response: AxiosResponse<Hashtag[]> = await api.get('/hashtags/trending');
    return response.data;
  }
};

// Search API
export const searchAPI = {
  search: async (query: string, type?: 'all' | 'posts' | 'users' | 'hashtags', page = 1, limit = 10): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ results: SearchResult[]; total: number; hasMore: boolean }> = await api.get('/search', {
      params: { q: query, type, page, limit }
    });
    return response.data;
  },

  getSuggestions: async (query: string): Promise<SearchResult[]> => {
    const response: AxiosResponse<SearchResult[]> = await api.get('/search/suggestions', {
      params: { q: query }
    });
    return response.data;
  }
};

// Moderation API
export const moderationAPI = {
  reportContent: async (contentType: 'post' | 'comment' | 'user', contentId: string, reason: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/moderation/report', {
      contentType,
      contentId,
      reason
    });
    return response.data;
  },

  checkContent: async (content: string): Promise<{ isAppropriate: boolean; confidence: number; flags: string[] }> => {
    const response: AxiosResponse<{ isAppropriate: boolean; confidence: number; flags: string[] }> = await api.post('/moderation/check', {
      content
    });
    return response.data;
  }
};

export default api; 
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
    console.log('Axios request interceptor - URL:', config.url);
    console.log('Axios request interceptor - Method:', config.method);
    console.log('Axios request interceptor - Data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Auth token added to request');
    }
    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Axios response interceptor - Status:', response.status);
    console.log('Axios response interceptor - URL:', response.config.url);
    return response;
  },
  (error) => {
    console.error('Axios response interceptor error:', error);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    // Only redirect to login for 401 errors on authenticated endpoints (not login/register)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        // Only redirect for non-auth endpoints (expired token)
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
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
    console.log('authAPI.login called with credentials:', { email: credentials.email, password: '***' });
    console.log('Making POST request to:', `${API_BASE_URL}/auth/login`);
    
    const response: AxiosResponse<{ success: boolean; data: { user: User; tokens: { accessToken: string } }; message: string }> = await api.post('/auth/login', credentials);
    
    console.log('authAPI.login response:', response.data);
    
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
  getFeed: async (page = 1, limit = 20): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { posts: Post[] }; message: string }> = await api.get('/feed', {
      params: { page, limit }
    });
    return {
      posts: response.data.data.posts,
      total: response.data.data.posts.length,
      hasMore: response.data.data.posts.length === parseInt(limit.toString())
    };
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
      postData.hashtags.forEach(hashtag => formData.append('hashtags[]', hashtag));
    }
    
    if (postData.mentions) {
      postData.mentions.forEach(mention => formData.append('mentions[]', mention));
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
    const response: AxiosResponse<{ success: boolean; data: { post: Post }; message: string }> = await api.put(`/posts/${postId}`, postData);
    return response.data.data.post;
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/posts/${postId}`);
    return { message: response.data.message };
  },

  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { posts: Post[] }; message: string }> = await api.get(`/posts/user/${userId}`, {
      params: { page, limit }
    });
    return {
      posts: response.data.data.posts,
      total: response.data.data.posts.length,
      hasMore: response.data.data.posts.length === parseInt(limit.toString())
    };
  }
};

// Likes API
export const likesAPI = {
  likePost: async (postId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post(`/likes/${postId}`, { type: 'post' });
    return { message: response.data.message };
  },

  unlikePost: async (postId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/likes/${postId}`, { data: { type: 'post' } });
    return { message: response.data.message };
  },

  likeComment: async (commentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post(`/likes/${commentId}`, { type: 'comment' });
    return { message: response.data.message };
  },

  unlikeComment: async (commentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/likes/${commentId}`, { data: { type: 'comment' } });
    return { message: response.data.message };
  },

  getPostLikes: async (postId: string, page = 1, limit = 20): Promise<{ users: User[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { users: User[] }; message: string }> = await api.get(`/likes/${postId}`, {
      params: { type: 'post', page, limit }
    });
    return {
      users: response.data.data.users,
      total: response.data.data.users.length,
      hasMore: response.data.data.users.length === parseInt(limit.toString())
    };
  }
};

// Shares API
export const sharesAPI = {
  sharePost: async (postId: string, shareData?: { message?: string }): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post(`/shares/${postId}`, shareData);
    return { message: response.data.message };
  },

  getPostShares: async (postId: string, page = 1, limit = 20): Promise<{ shares: any[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { shares: any[] }; message: string }> = await api.get(`/shares/${postId}`, {
      params: { page, limit }
    });
    return {
      shares: response.data.data.shares,
      total: response.data.data.shares.length,
      hasMore: response.data.data.shares.length === parseInt(limit.toString())
    };
  },

  getUserShares: async (userId: string, page = 1, limit = 10): Promise<{ shares: any[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { shares: any[] }; message: string }> = await api.get(`/shares/user/${userId}`, {
      params: { page, limit }
    });
    return {
      shares: response.data.data.shares,
      total: response.data.data.shares.length,
      hasMore: response.data.data.shares.length === parseInt(limit.toString())
    };
  }
};

// Comments API
export const commentsAPI = {
  getComments: async (postId: string, page = 1, limit = 10): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { comments: Comment[] }; message: string }> = await api.get(`/comments/${postId}`, {
      params: { page, limit }
    });
    return {
      comments: response.data.data.comments,
      total: response.data.data.comments.length,
      hasMore: response.data.data.comments.length === parseInt(limit.toString())
    };
  },

  createComment: async (postId: string, commentData: { content: string; parentComment?: string }): Promise<Comment> => {
    const response: AxiosResponse<{ success: boolean; data: { comment: Comment }; message: string }> = await api.post(`/comments`, {
      post: postId,
      ...commentData
    });
    return response.data.data.comment;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response: AxiosResponse<{ success: boolean; data: { comment: Comment }; message: string }> = await api.put(`/comments/${commentId}`, { content });
    return response.data.data.comment;
  },

  deleteComment: async (commentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/comments/${commentId}`);
    return { message: response.data.message };
  }
};

// Users API
export const usersAPI = {
  getUser: async (userId: string): Promise<User> => {
    const response: AxiosResponse<{ success: boolean; data: { user: User }; message: string }> = await api.get(`/users/${userId}`);
    return response.data.data.user;
  },

  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { posts: Post[]; total: number; hasMore: boolean }; message: string }> = await api.get(`/users/${userId}/posts`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  followUser: async (userId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post(`/users/${userId}/follow`);
    return { message: response.data.message };
  },

  unfollowUser: async (userId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/users/${userId}/follow`);
    return { message: response.data.message };
  },

  getFollowers: async (userId: string, page = 1, limit = 20): Promise<{ users: User[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { users: User[]; total: number; hasMore: boolean }; message: string }> = await api.get(`/users/${userId}/followers`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  getFollowing: async (userId: string, page = 1, limit = 20): Promise<{ users: User[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { users: User[]; total: number; hasMore: boolean }; message: string }> = await api.get(`/users/${userId}/following`, {
      params: { page, limit }
    });
    return response.data.data;
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
  searchPosts: async (query: string, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { posts: Post[] }; message: string }> = await api.get('/search/posts', {
      params: { q: query, page, limit }
    });
    return {
      posts: response.data.data.posts,
      total: response.data.data.posts.length,
      hasMore: response.data.data.posts.length === parseInt(limit.toString())
    };
  },

  searchUsers: async (query: string, page = 1, limit = 10): Promise<{ users: User[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { users: User[] }; message: string }> = await api.get('/search/users', {
      params: { q: query, page, limit }
    });
    return {
      users: response.data.data.users,
      total: response.data.data.users.length,
      hasMore: response.data.data.users.length === parseInt(limit.toString())
    };
  },

  searchHashtags: async (query: string, page = 1, limit = 10): Promise<{ hashtags: Hashtag[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { hashtags: Hashtag[] }; message: string }> = await api.get('/search/hashtags', {
      params: { q: query, page, limit }
    });
    return {
      hashtags: response.data.data.hashtags,
      total: response.data.data.hashtags.length,
      hasMore: response.data.data.hashtags.length === parseInt(limit.toString())
    };
  },

  globalSearch: async (query: string, page = 1, limit = 10): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { results: SearchResult[] }; message: string }> = await api.get('/search/global', {
      params: { q: query, page, limit }
    });
    return {
      results: response.data.data.results,
      total: response.data.data.results.length,
      hasMore: response.data.data.results.length === parseInt(limit.toString())
    };
  }
};

// Moderation API
export const moderationAPI = {
  checkContent: async (content: string): Promise<{ isAppropriate: boolean; confidence: number; flags: string[] }> => {
    const response: AxiosResponse<{ success: boolean; data: { isAppropriate: boolean; confidence: number; flags: string[] }; message: string }> = await api.post('/moderation/check', {
      content
    });
    return response.data.data;
  },

  reportContent: async (contentType: 'post' | 'comment' | 'user', contentId: string, reason: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/moderation/report', {
      contentType,
      contentId,
      reason
    });
    return { message: response.data.message };
  },

  getPendingPosts: async (page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response: AxiosResponse<{ success: boolean; data: { posts: Post[] }; message: string }> = await api.get('/moderation/pending', {
      params: { page, limit }
    });
    return {
      posts: response.data.data.posts,
      total: response.data.data.posts.length,
      hasMore: response.data.data.posts.length === parseInt(limit.toString())
    };
  },

  getModerationStats: async (): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any; message: string }> = await api.get('/moderation/stats');
    return response.data.data;
  },

  moderatePost: async (postId: string, action: 'approve' | 'reject', reason?: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.put(`/moderation/${postId}`, {
      action,
      reason
    });
    return { message: response.data.message };
  }
};

// Notifications API
export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share' | 'reply';
  post?: {
    _id: string;
    content: string;
  };
  comment?: {
    _id: string;
    content: string;
  };
  isRead: boolean;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export const notificationsAPI = {
  getNotifications: async (page = 1, limit = 20, type?: string): Promise<{ notifications: Notification[]; total: number; hasMore: boolean }> => {
    const params: any = { page, limit };
    if (type) params.type = type;
    
    const response: AxiosResponse<{ success: boolean; data: { notifications: Notification[]; total: number; hasMore: boolean }; message: string }> = await api.get('/notifications', { params });
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<{ notification: Notification }> => {
    const response: AxiosResponse<{ success: boolean; data: { notification: Notification }; message: string }> = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.put('/notifications/read-all');
    return { message: response.data.message };
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response: AxiosResponse<{ success: boolean; data: { count: number }; message: string }> = await api.get('/notifications/unread-count');
    return response.data.data;
  },

  deleteNotification: async (notificationId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/notifications/${notificationId}`);
    return { message: response.data.message };
  },

  getSuggestedUsers: async (limit = 5): Promise<{ users: User[] }> => {
    const response: AxiosResponse<{ success: boolean; data: { users: User[] }; message: string }> = await api.get('/notifications/suggested-users', {
      params: { limit }
    });
    return response.data.data;
  }
};

export default api; 
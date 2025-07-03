// JWT Token utility functions
export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  iat?: number;
  exp?: number;
}

// Decode JWT token without verification (for client-side use)
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

// Get basic user info from token
export const getUserFromToken = (token: string): Partial<TokenPayload> | null => {
  const payload = decodeToken(token);
  if (!payload) return null;
  
  return {
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    isVerified: payload.isVerified,
    isActive: payload.isActive
  };
}; 
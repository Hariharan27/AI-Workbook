// Utility function to construct full image URLs
const BACKEND_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /uploads, prepend the backend base URL
  if (imagePath.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${encodeURI(imagePath)}`;
  }
  
  // If it's a relative path, prepend the backend base URL and /uploads
  return `${BACKEND_BASE_URL}/uploads/${encodeURI(imagePath)}`;
}; 
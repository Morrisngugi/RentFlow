import axios, { AxiosInstance } from 'axios';
import { User, LoginRequest, LoginResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get base URL for images/uploads (without /api/v1 suffix)
export const getImageBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  // Remove /api/v1 or /api/v1/ suffix to get the base domain URL
  return apiUrl.replace(/\/api\/v\d+\/?$/, '');
};

// Encode URL for use as query parameter
const encodeUrlParam = (url: string): string => {
  return encodeURIComponent(url);
};

// Convert relative logo path to full URL
export const getLogoUrl = (logoPath: string | null | undefined): string => {
  if (!logoPath) return '/logo.png';
  
  // If it's a Cloudinary URL, convert to JPEG for better browser support and proxy through backend
  if (logoPath.includes('res.cloudinary.com')) {
    // Add Cloudinary transformation to convert to JPEG with quality 85
    const transformedUrl = logoPath.replace(
      '/upload/',
      '/upload/q_85,f_jpg/'
    );
    return `${getImageBaseUrl()}/api/images/proxy?url=${encodeUrlParam(transformedUrl)}`;
  }
  
  // If it's already an absolute URL (but not Cloudinary)
  if (logoPath.startsWith('http')) return logoPath;
  
  // Otherwise, construct from base URL (for relative paths)
  return `${getImageBaseUrl()}${logoPath}`;
};

// Convert relative profile image path to full URL
export const getProfileImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If it's a Cloudinary URL, convert to JPEG for better browser support and proxy through backend
  if (imagePath.includes('res.cloudinary.com')) {
    // Add Cloudinary transformation to convert to JPEG with quality 85
    const transformedUrl = imagePath.replace(
      '/upload/',
      '/upload/q_85,f_jpg/'
    );
    return `${getImageBaseUrl()}/api/images/proxy?url=${encodeUrlParam(transformedUrl)}`;
  }
  
  // If it's already an absolute URL (but not Cloudinary)
  if (imagePath.startsWith('http')) return imagePath;
  
  // Otherwise, construct from base URL (for relative paths)
  return `${getImageBaseUrl()}${imagePath}`;
};

// API Client wrapper class
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axiosInstance;
  }

  setToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.axiosInstance.get<User>('/users/profile');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.axiosInstance.post('/auth/logout');
    this.clearToken();
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.axiosInstance.put<User>('/users/profile', data);
    return response.data;
  }

  async getNotifications(): Promise<any[]> {
    const response = await this.axiosInstance.get('/users/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.axiosInstance.put(`/users/notifications/${notificationId}/read`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;

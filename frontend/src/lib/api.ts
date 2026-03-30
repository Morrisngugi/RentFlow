import axios, { AxiosInstance } from 'axios';
import { User, LoginRequest, LoginResponse, Notification } from './types';

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
    const response = await this.axiosInstance.post<any>('/auth/login', credentials);
    return response.data.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.axiosInstance.get<any>('/auth/profile');
    return response.data.data;
  }

  async logout(): Promise<void> {
    await this.axiosInstance.post('/auth/logout');
    this.clearToken();
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.axiosInstance.put<any>('/auth/profile', data);
    return response.data.data;
  }

  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    try {
      const response = await this.axiosInstance.get<any>('/notifications', {
        params: {
          limit: limit || 20,
          offset: offset || 0,
        },
      });
      return response.data.data.notifications || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.axiosInstance.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.axiosInstance.patch('/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(): Promise<number> {
    try {
      const response = await this.axiosInstance.get<any>('/notifications/unread-count');
      return response.data.data.unreadCount || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  // Complaint methods
  async createComplaint(data: {
    leaseId: string;
    title: string;
    description: string;
    complaintType: 'maintenance' | 'billing' | 'safety' | 'noise' | 'other';
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/complaints', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create complaint:', error);
      throw error;
    }
  }

  async getMyComplaints(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get<any>('/complaints/my-complaints');
      const complaints = response.data?.data?.complaints || response.data?.complaints || [];
      return Array.isArray(complaints) ? complaints : [];
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      return [];
    }
  }

  async getComplaintById(complaintId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/complaints/${complaintId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch complaint:', error);
      throw error;
    }
  }

  async updateComplaintStatus(
    complaintId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.patch(`/complaints/${complaintId}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      throw error;
    }
  }

  // Lease and payment methods
  async getTenantLeases(tenantId: number | string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get<any>(`/leases/by-tenant/${tenantId}`);
      const leases = response.data?.data || [];
      if (Array.isArray(leases)) {
        return leases;
      } else if (leases && typeof leases === 'object') {
        return [leases];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch tenant leases:', error);
      return [];
    }
  }

  async getMonthlyBreakdown(leaseId: string, month: number, year: number): Promise<any> {
    try {
      const response = await this.axiosInstance.get<any>(
        `/leases/${leaseId}/monthly-breakdown?month=${month}&year=${year}`
      );
      return response.data?.data || null;
    } catch (error) {
      console.error('Failed to fetch monthly breakdown:', error);
      return null;
    }
  }

  async getPaymentHistory(leaseId: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get<any>(`/leases/${leaseId}/payment-history`);
      const history = response.data?.data || [];
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;

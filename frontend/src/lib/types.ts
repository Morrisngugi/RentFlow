// Type definitions for RentFlow

export type UserRole = 'admin' | 'landlord' | 'tenant' | 'agent';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface Property {
  id: number;
  name: string;
  address: string;
  type: string;
  status: string;
  landlordId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  leaseId: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: number;
  userId?: number;
  name: string;
  email: string;
  phone?: string;
  idNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Landlord {
  id: number;
  userId?: number;
  name: string;
  email: string;
  phone?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface MenuItem {
  name: string;
  href: string;
  icon: string;
  description?: string;
}

export interface Complaint {
  id: string;
  leaseId: string;
  title: string;
  description: string;
  complaintType: 'maintenance' | 'billing' | 'safety' | 'noise' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyRentBreakdown {
  id: string;
  leaseId: string;
  month: number;
  year: number;
  baseRent: number;
  additionalCharges: number;
  securityDeposit: number;
  totalDue: number;
  amountPaid: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

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
  bankDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  name: string;
  href: string;
  icon: string;
  description?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

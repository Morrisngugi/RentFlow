import { MenuItem, UserRole } from './types';

// Role-based navigation configuration
export const roleMenuConfig: Record<UserRole, MenuItem[]> = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'System overview' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️', description: 'Account settings' },
  ],

  landlord: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Overview' },
    { name: 'Properties', href: '/dashboard/properties', icon: '🏠', description: 'My properties' },
    { name: 'Tenants', href: '/dashboard/tenants', icon: '👥', description: 'My tenants' },
    { name: 'Leases', href: '/dashboard/leases', icon: '📄', description: 'Active leases' },
    { name: 'Payments', href: '/dashboard/payments', icon: '💰', description: 'Rental payments' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈', description: 'My reports' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤', description: 'My profile' },
  ],

  tenant: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Overview' },
    { name: 'Lease', href: '/dashboard/leases', icon: '📄', description: 'My lease details' },
    { name: 'Payments', href: '/dashboard/payments', icon: '💰', description: 'My payments' },
    { name: 'Complaints', href: '/dashboard/complaints', icon: '⚠️', description: 'Maintenance requests' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤', description: 'My profile' },
  ],

  agent: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Overview' },
    { name: 'Landlords', href: '/dashboard/landlords', icon: '👨‍💼', description: 'Manage landlords' },
    { name: 'Properties', href: '/dashboard/properties', icon: '🏠', description: 'All properties' },
    { name: 'Tenants', href: '/dashboard/tenants', icon: '👥', description: 'Tenant management' },
    { name: 'Leases', href: '/dashboard/leases', icon: '📄', description: 'Active leases' },
    { name: 'Payments', href: '/dashboard/payments', icon: '💰', description: 'Payment tracking' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈', description: 'Performance' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤', description: 'My profile' },
  ],
};

// Get menu items for a role
export function getMenuForRole(role: UserRole | undefined): MenuItem[] {
  if (!role) return [];
  return roleMenuConfig[role as UserRole] || [];
}

// Get dashboard title for role
export function getDashboardTitleForRole(role: UserRole | undefined): string {
  const titles: Record<UserRole, string> = {
    admin: 'Admin Dashboard',
    landlord: 'Landlord Dashboard',
    tenant: 'Tenant Dashboard',
    agent: 'Agent Dashboard',
  };
  return titles[role as UserRole] || 'Dashboard';
}

// Get default dashboard route for role
export function getDefaultDashboardRoute(role: UserRole | undefined): string {
  return '/dashboard';
}
export type { MenuItem };


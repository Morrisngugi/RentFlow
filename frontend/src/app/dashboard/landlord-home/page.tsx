'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';
import DashboardSummary from '@/components/landlord/DashboardSummary';
import PropertyCard from '@/components/landlord/PropertyCard';
import LeaseTimeline from '@/components/landlord/LeaseTimeline';
import AlertsPanel from '@/components/landlord/AlertsPanel';

interface DashboardStats {
  totalProperties: number;
  activeLeases: number;
  expectedMonthlyRent: number;
  pendingPayments: number;
  occupancyRate: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  unitCount: number;
  occupiedUnits: number;
  expectedMonthlyRent: number;
  baseRent: number;
  securityFees: number;
  estimatedUtilities: number;
  tenants: Array<{
    id: string;
    name: string;
    unit: string;
    rent: number;
    paymentStatus: 'paid' | 'pending' | 'overdue' | 'partial';
  }>;
  upcomingLeaseExpirations: Array<{
    tenantId: string;
    tenantName: string;
    unit: string;
    endDate: string;
    daysUntilExpiry: number;
  }>;
}

interface Alert {
  id: string;
  type: 'lease_expiring' | 'payment_overdue' | 'payment_pending' | 'property_vacancy';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
  actionUrl?: string;
}

export default function LandlordDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeLeases: 0,
    expectedMonthlyRent: 0,
    pendingPayments: 0,
    occupancyRate: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [leaseTimeline, setLeaseTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      if (userData.role !== 'landlord') {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch properties and leases
      const propertiesData = await apiClient.getProperties();
      
      // Process properties data into dashboard format
      const processedProperties: Property[] = [];
      let totalActiveLeases = 0;
      let totalExpectedRent = 0;
      let totalPendingPayments = 0;
      let totalOccupiedUnits = 0;
      let totalUnits = 0;

      const timelineEvents = new Map();
      const dashboardAlerts: Alert[] = [];

      // Mock data processing - adjust based on your API response format
      if (Array.isArray(propertiesData)) {
        propertiesData.forEach((property: any) => {
          // Calculate property metrics
          const unitCount = property.totalUnits || 5; // Mock
          const occupiedUnits = Math.ceil(unitCount * 0.8); // Mock: 80% occupancy
          const baseRent = (property.monthlyRent || 12000) * occupiedUnits;
          const securityFees = 2000 * occupiedUnits; // Mock
          const estimatedUtilities = 1000 * occupiedUnits; // Mock
          const expectedMonthlyRent = baseRent + securityFees + estimatedUtilities;

          // Mock tenants data
          const tenants = Array.from({ length: occupiedUnits }, (_, i) => {
            const statuses: ('paid' | 'pending' | 'overdue' | 'partial')[] = ['overdue', 'pending', 'partial', 'paid'];
            return {
              id: `tenant-${i}`,
              name: `Tenant ${i + 1}`,
              unit: `Unit ${i + 1}`,
              rent: property.monthlyRent || 12000,
              paymentStatus: statuses[i % 4],
            };
          });

          // Mock lease expirations
          const upcomingLeaseExpirations = tenants
            .slice(0, 3)
            .map((tenant, i) => {
              const expiryDate = new Date();
              expiryDate.setMonth(expiryDate.getMonth() + (i + 1));
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return {
                tenantId: tenant.id,
                tenantName: tenant.name,
                unit: tenant.unit,
                endDate: expiryDate.toISOString(),
                daysUntilExpiry,
              };
            });

          processedProperties.push({
            id: property.id,
            name: property.name,
            address: property.address,
            city: property.city,
            unitCount,
            occupiedUnits,
            expectedMonthlyRent,
            baseRent,
            securityFees,
            estimatedUtilities,
            tenants,
            upcomingLeaseExpirations,
          });

          totalActiveLeases += occupiedUnits;
          totalExpectedRent += expectedMonthlyRent;
          totalOccupiedUnits += occupiedUnits;
          totalUnits += unitCount;
          totalPendingPayments += Math.floor(Math.random() * 3); // Mock

          // Generate lease timeline events
          upcomingLeaseExpirations.forEach((lease) => {
            const date = new Date(lease.endDate);
            const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
            if (!timelineEvents.has(monthKey)) {
              timelineEvents.set(monthKey, {
                month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
                year: date.getFullYear(),
                leaseCount: 0,
                leases: [],
              });
            }
            const event = timelineEvents.get(monthKey);
            event.leaseCount++;
            event.leases.push({
              propertyName: property.name,
              unitName: lease.unit,
              tenantName: lease.tenantName,
            });
          });

          // Generate alerts
          if (totalPendingPayments > 0) {
            dashboardAlerts.push({
              id: `alert-payment-${property.id}`,
              type: 'payment_pending',
              title: `Payment Pending - ${property.name}`,
              description: `One or more payments are pending collection`,
              severity: 'warning',
              createdAt: new Date().toISOString(),
              actionUrl: `/dashboard/payments?property=${property.id}`,
            });
          }

          upcomingLeaseExpirations.forEach((lease) => {
            if (lease.daysUntilExpiry < 30 && lease.daysUntilExpiry > 0) {
              dashboardAlerts.push({
                id: `alert-lease-${lease.tenantId}`,
                type: 'lease_expiring',
                title: `Lease Expiring Soon - ${property.name}`,
                description: `${lease.tenantName} (${lease.unit}) lease expires in ${lease.daysUntilExpiry} days`,
                severity: 'warning',
                createdAt: new Date().toISOString(),
                actionUrl: `/dashboard/leases?property=${property.id}`,
              });
            } else if (lease.daysUntilExpiry <= 0) {
              dashboardAlerts.push({
                id: `alert-lease-expired-${lease.tenantId}`,
                type: 'lease_expiring',
                title: `Lease Expired - ${property.name}`,
                description: `${lease.tenantName} (${lease.unit}) lease expired ${Math.abs(lease.daysUntilExpiry)} days ago`,
                severity: 'critical',
                createdAt: new Date().toISOString(),
                actionUrl: `/dashboard/leases?property=${property.id}`,
              });
            }
          });

          if (occupiedUnits < unitCount) {
            dashboardAlerts.push({
              id: `alert-vacancy-${property.id}`,
              type: 'property_vacancy',
              title: `Vacancy - ${property.name}`,
              description: `${unitCount - occupiedUnits} unit${unitCount - occupiedUnits > 1 ? 's' : ''} available`,
              severity: 'info',
              createdAt: new Date().toISOString(),
              actionUrl: `/dashboard/properties/${property.id}`,
            });
          }
        });
      }

      setProperties(processedProperties);
      setStats({
        totalProperties: processedProperties.length,
        activeLeases: totalActiveLeases,
        expectedMonthlyRent: totalExpectedRent,
        pendingPayments: totalPendingPayments,
        occupancyRate: totalUnits > 0 ? Math.round((totalOccupiedUnits / totalUnits) * 100) : 0,
      });
      setLeaseTimeline(Array.from(timelineEvents.values()));
      setAlerts(dashboardAlerts.slice(0, 10)); // Show top 10 alerts
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplaintIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'billing':
        return '💵';
      case 'safety':
        return '🚨';
      case 'noise':
        return '🔊';
      default:
        return '⚠️';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProperties = properties.filter(
    (prop) =>
      prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading landlord dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'Landlord'}! 👋
        </h1>
        <p className="text-gray-600 text-lg">Manage your properties, track tenants, and monitor rent collection</p>
      </div>

      {/* Summary Cards */}
      <DashboardSummary data={stats} isLoading={loading} />

      {/* Filters and View Controls */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:flex-1">
          <input
            type="text"
            placeholder="🔍 Search properties by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('list')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              viewType === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewType('grid')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              viewType === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🎯 Grid
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Properties Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🏢 Your Properties ({filteredProperties.length})
          </h2>

          {filteredProperties.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              {properties.length === 0 ? (
                <>
                  <p className="text-gray-600 text-lg mb-4">No properties yet</p>
                  <Link href="/dashboard/properties/create">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                      ➕ Add Your First Property
                    </button>
                  </Link>
                </>
              ) : (
                <p className="text-gray-600">No properties match your search</p>
              )}
            </div>
          ) : (
            <div
              className={`gap-6 ${
                viewType === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2'
                  : 'flex flex-col'
              }`}
            >
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  {...property}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Alerts and Actions */}
        <div className="space-y-6">
          {/* Alerts Panel */}
          <AlertsPanel alerts={alerts} isLoading={loading} />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">⚡ Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/properties/create">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition text-left">
                  ➕ Add Property
                </button>
              </Link>
              <Link href="/dashboard/tenants">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition text-left">
                  👥 Manage Tenants
                </button>
              </Link>
              <Link href="/dashboard/leases">
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition text-left">
                  📄 View Leases
                </button>
              </Link>
              <Link href="/dashboard/payments">
                <button className="w-full px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 transition text-left">
                  💰 Collect Payments
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lease Timeline Section */}
      {filteredProperties.length > 0 && (
        <LeaseTimeline events={leaseTimeline} isLoading={loading} />
      )}
    </div>
  );
}

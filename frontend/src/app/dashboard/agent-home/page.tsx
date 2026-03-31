'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';

interface AgentStats {
  assignedProperties: number;
  managedTenants: number;
  activeLeases: number;
  openComplaints: number;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<AgentStats>({
    assignedProperties: 0,
    managedTenants: 0,
    activeLeases: 0,
    openComplaints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      if (userData.role !== 'agent') {
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
      // Fetch agent dashboard stats
      const agentStats = await apiClient.getAgentStats();
      const agentComplaintsResponse = await apiClient.getAgentComplaints(5);

      setStats(agentStats);
      setRecentComplaints(agentComplaintsResponse.complaints || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setRecentComplaints([]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'Agent'}
        </h1>
        <p className="text-gray-600 text-lg">Property Management Overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Properties */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Properties</p>
              <p className="text-3xl font-bold mt-2">{stats.assignedProperties}</p>
            </div>
            <div className="text-5xl opacity-20">🏠</div>
          </div>
        </div>

        {/* Managed Tenants */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Managed Tenants</p>
              <p className="text-3xl font-bold mt-2">{stats.managedTenants}</p>
            </div>
            <div className="text-5xl opacity-20">👥</div>
          </div>
        </div>

        {/* Active Leases */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Leases</p>
              <p className="text-3xl font-bold mt-2">{stats.activeLeases}</p>
            </div>
            <div className="text-5xl opacity-20">📄</div>
          </div>
        </div>

        {/* Open Complaints */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Open Complaints</p>
              <p className="text-3xl font-bold mt-2">{stats.openComplaints}</p>
            </div>
            <div className="text-5xl opacity-20">🔔</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Complaints to Address</h2>
            <Link href="/dashboard/agent-complaints">
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">
                View All →
              </button>
            </Link>
          </div>
          
          {recentComplaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No complaints assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <Link key={complaint.id} href={`/dashboard/agent-complaints?complaintId=${complaint.id}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{getComplaintIcon(complaint.type)}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{complaint.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">{complaint.property?.name || 'N/A'}</span>
                            <span className="text-xs text-gray-500 font-medium">👤 {complaint.tenant?.name || 'N/A'}</span>
                            <span className="text-xs text-gray-500">{formatDate(complaint.createdAt)}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                              {complaint.status === 'in_progress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/landlords">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-left flex items-center gap-2">
                <span>👨‍💼</span> Manage Landlords
              </button>
            </Link>
            <Link href="/dashboard/properties">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-left flex items-center gap-2">
                <span>🏠</span> View Properties
              </button>
            </Link>
            <Link href="/dashboard/tenants">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-left flex items-center gap-2">
                <span>👥</span> Manage Tenants
              </button>
            </Link>
            <Link href="/dashboard/agent-complaints">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-left flex items-center gap-2">
                <span>⚠️</span> View All Complaints
              </button>
            </Link>
            <Link href="/dashboard/profile">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-left flex items-center gap-2">
                <span>👤</span> My Profile
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

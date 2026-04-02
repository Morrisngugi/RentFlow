'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getApiUrl } from '@/lib/api';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  initials: string;
}

interface ApiResponse {
  data: Tenant[];
  error?: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getApiUrl()}/tenants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch tenants');
      }

      const result: ApiResponse = await response.json();
      setTenants(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage your tenants and track their information</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No tenants yet</h3>
          <p className="text-gray-600">Tenants will appear here once properties are created and occupied</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500 cursor-pointer"
              onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                {/* Avatar with Initials */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {tenant.initials}
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    tenant.status
                  )}`}
                >
                  {tenant.status}
                </span>
              </div>

              {/* Tenant Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {tenant.firstName} {tenant.lastName}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{tenant.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{tenant.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{formatDate(tenant.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {tenants.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Tenants</h3>
            <p className="text-3xl font-bold text-gray-900">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Tenants</h3>
            <p className="text-3xl font-bold text-gray-900">
              {tenants.filter(t => t.status === 'Active').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint when available
        // const data = await apiClient.getTenants();
        // setTenants(data);
        
        // For now, show mock data
        setTenants([
          {
            id: '1',
            name: 'John Kariuki',
            email: 'john.kariuki@example.com',
            phone: '0722111222',
            status: 'Active',
            createdAt: '2/28/2026',
          },
          {
            id: '2',
            name: 'Sarah Omondi',
            email: 'sarah.omondi@example.com',
            phone: '0733222333',
            status: 'Active',
            createdAt: '3/5/2026',
          },
          {
            id: '3',
            name: 'Michael Kipchoge',
            email: 'michael.kip@example.com',
            phone: '0701333444',
            status: 'Inactive',
            createdAt: '3/1/2026',
          },
          {
            id: '4',
            name: 'Grace Ngeno',
            email: 'grace.ngeno@example.com',
            phone: '0722444555',
            status: 'Active',
            createdAt: '2/15/2026',
          },
          {
            id: '5',
            name: 'David Mwangi',
            email: 'david.mwangi@example.com',
            phone: '0741555666',
            status: 'Active',
            createdAt: '3/10/2026',
          },
        ]);
        setLoading(false);
      } catch (err) {
        setError('Failed to load tenants');
        setLoading(false);
      }
    };

    if (user) {
      fetchTenants();
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tenants</h1>
          <p className="text-gray-600 text-lg">
            {user?.role === 'admin'
              ? 'Manage all tenants in the system'
              : 'View tenant information'}
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => router.push('/dashboard/tenants/add')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
          >
            + Add Tenant
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-600 text-red-800 rounded">
          {error}
        </div>
      )}

      {/* Tenants Grid/List */}
      <div className="grid grid-cols-1 gap-4">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border-l-4 border-blue-500 cursor-pointer group"
            onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
          >
            <div className="flex items-start justify-between">
              {/* Tenant Info */}
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {getInitials(tenant.name)}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {tenant.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Email:</span> {tenant.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Phone:</span> {tenant.phone}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Created:</span> {tenant.createdAt}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
                    tenant.status
                  )}`}
                >
                  {tenant.status}
                </span>

                {user?.role === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Tenants Found</h3>
          <p className="text-gray-600">
            {user?.role === 'admin'
              ? 'Start by adding your first tenant to the system.'
              : 'There are no tenants to display.'}
          </p>
          {user?.role === 'admin' && (
            <button
              onClick={() => router.push('/dashboard/tenants/add')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Tenant
            </button>
          )}
        </div>
      )}
    </div>
  );
}

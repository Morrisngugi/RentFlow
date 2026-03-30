'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lease {
  id: string;
  property: string;
  tenant: string;
  startDate: string;
  endDate: string;
  status: string;
  rentAmount: number;
}

export default function LeasesPage() {
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      // Redirect tenants away from leases management page
      if (user.role === 'tenant') {
        router.push('/dashboard/tenant-home');
        return;
      }
    }
    // TODO: Fetch leases from API
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="text-center text-gray-600">Loading leases...</div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Active Leases</h1>
          <p className="text-gray-600 text-lg">Manage and track all active leases</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/leases/new')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          + New Lease
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Leases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {leases.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No leases found</p>
            <button
              onClick={() => router.push('/dashboard/leases/new')}
              className="px-6 py-2 bg-rentflow-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Lease
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Property</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tenant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((lease) => (
                <tr key={lease.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{lease.property}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lease.tenant}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(lease.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(lease.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">KES {lease.rentAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      lease.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-rentflow-blue hover:underline font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

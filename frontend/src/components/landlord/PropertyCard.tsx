'use client';

import Link from 'next/link';

interface TenantInfo {
  id: string;
  name: string;
  unit: string;
  rent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'partial';
}

interface LeaseInfo {
  tenantId: string;
  tenantName: string;
  unit: string;
  endDate: string;
  daysUntilExpiry: number;
}

interface PropertyCardProps {
  id: string;
  name: string;
  address: string;
  city: string;
  unitCount: number;
  occupiedUnits: number;
  tenants: TenantInfo[];
  expectedMonthlyRent: number;
  baseRent: number;
  securityFees: number;
  estimatedUtilities: number;
  upcomingLeaseExpirations: LeaseInfo[];
}

function getDaysColor(days: number): string {
  if (days < 0) return 'text-gray-500'; // Expired
  if (days <= 30) return 'text-red-600 font-semibold'; // Critical
  if (days <= 60) return 'text-yellow-600 font-semibold'; // Warning
  return 'text-green-600'; // Safe
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'partial':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusIcon(status: string): string {
  switch (status) {
    case 'paid':
      return '✓';
    case 'overdue':
      return '!';
    case 'partial':
      return '◐';
    default:
      return '○';
  }
}

export default function PropertyCard({
  id,
  name,
  address,
  city,
  unitCount,
  occupiedUnits,
  tenants,
  expectedMonthlyRent,
  baseRent,
  securityFees,
  estimatedUtilities,
  upcomingLeaseExpirations,
}: PropertyCardProps) {
  const occupancyPercentage = Math.round((occupiedUnits / unitCount) * 100);
  const emptyUnits = unitCount - occupiedUnits;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{address}, {city}</p>
          </div>
          <Link href={`/dashboard/properties/${id}`}>
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
              Details →
            </button>
          </Link>
        </div>
      </div>

      {/* Occupancy Section */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">📊 Occupancy Rate</span>
          <span className={`text-sm font-bold ${occupancyPercentage >= 75 ? 'text-green-600' : occupancyPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {occupancyPercentage}% ({occupiedUnits}/{unitCount})
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
        {emptyUnits > 0 && (
          <p className="text-xs text-gray-600 mt-2">
            🟦 {emptyUnits} unit{emptyUnits > 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Revenue Section */}
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 mb-3">💰 Expected Monthly Revenue</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Base Rent ({occupiedUnits} units)</span>
            <span className="font-mono font-semibold">KES {baseRent.toLocaleString()}</span>
          </div>
          {securityFees > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Security Fees</span>
              <span className="font-mono font-semibold">KES {securityFees.toLocaleString()}</span>
            </div>
          )}
          {estimatedUtilities > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Est. Utilities/Charges</span>
              <span className="font-mono font-semibold">KES {estimatedUtilities.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
            <span className="font-semibold text-gray-800">TOTAL</span>
            <span className="font-mono font-bold text-lg text-blue-600">KES {expectedMonthlyRent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Current Tenants Section */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">👥 Current Tenants ({tenants.length}/{unitCount})</p>
        <div className="space-y-2">
          {tenants.length > 0 ? (
            tenants.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{tenant.unit}</p>
                  <p className="text-xs text-gray-600">{tenant.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-mono font-semibold text-gray-800">KES {tenant.rent.toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${getPaymentStatusColor(tenant.paymentStatus)}`}>
                    {getPaymentStatusIcon(tenant.paymentStatus)}
                    <span className="capitalize">{tenant.paymentStatus.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-gray-500 text-sm">
              No tenants assigned yet
            </div>
          )}
          {tenants.length > 5 && (
            <p className="text-xs text-gray-600 italic">+ {tenants.length - 5} more tenant{tenants.length - 5 > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Lease Timeline Section */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">📅 Upcoming Lease Expirations</p>
        <div className="space-y-2">
          {upcomingLeaseExpirations.length > 0 ? (
            upcomingLeaseExpirations.slice(0, 4).map((lease) => (
              <div key={`${lease.tenantId}-expiry`} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{lease.unit} - {lease.tenantName}</p>
                  <p className="text-xs text-gray-600">{new Date(lease.endDate).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-semibold text-center min-w-16 ${getDaysColor(lease.daysUntilExpiry)}`}>
                  {lease.daysUntilExpiry < 0 ? 'Expired' : `${lease.daysUntilExpiry}d`}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-gray-500 text-sm">
              No upcoming expirations in next 6 months
            </div>
          )}
          {upcomingLeaseExpirations.length > 4 && (
            <p className="text-xs text-gray-600 italic">+ {upcomingLeaseExpirations.length - 4} more lease{upcomingLeaseExpirations.length - 4 > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <Link href={`/dashboard/properties/${id}`} className="flex-1">
          <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition">
            View Details
          </button>
        </Link>
        <Link href={`/dashboard/tenants?property=${id}`} className="flex-1">
          <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition">
            Manage Tenants
          </button>
        </Link>
      </div>
    </div>
  );
}

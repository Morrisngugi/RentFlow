'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-rentflow-navy to-rentflow-teal rounded-lg shadow p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome to RentFlow</h1>
        <p className="text-rentflow-gold text-lg">Property Rental Management System</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Properties Card */}
        <Link href="/dashboard/properties">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-t-4 border-rentflow-gold">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold text-rentflow-navy mb-1">Properties</h3>
            <p className="text-gray-600 text-sm">Manage all properties</p>
          </div>
        </Link>

        {/* Tenants Card */}
        <Link href="/dashboard/tenants">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-t-4 border-rentflow-gold">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-rentflow-navy mb-1">Tenants</h3>
            <p className="text-gray-600 text-sm">Manage tenant information</p>
          </div>
        </Link>

        {/* Leases Card */}
        <Link href="/dashboard/leases">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-t-4 border-rentflow-gold">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-rentflow-navy mb-1">Leases</h3>
            <p className="text-gray-600 text-sm">View active leases</p>
          </div>
        </Link>

        {/* Payments Card */}
        <Link href="/dashboard/payments">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-t-4 border-rentflow-gold">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-rentflow-navy mb-1">Payments</h3>
            <p className="text-gray-600 text-sm">Track payments</p>
          </div>
        </Link>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-rentflow-navy mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-rentflow-navy/5 rounded-lg border-l-4 border-rentflow-gold">
            <div className="text-gray-600 text-sm mb-1">Total Properties</div>
            <div className="text-3xl font-bold text-rentflow-navy">--</div>
          </div>
          <div className="p-4 bg-rentflow-navy/5 rounded-lg border-l-4 border-rentflow-gold">
            <div className="text-gray-600 text-sm mb-1">Active Leases</div>
            <div className="text-3xl font-bold text-rentflow-navy">--</div>
          </div>
          <div className="p-4 bg-rentflow-navy/5 rounded-lg border-l-4 border-rentflow-gold">
            <div className="text-gray-600 text-sm mb-1">Pending Payments</div>
            <div className="text-3xl font-bold text-rentflow-navy">--</div>
          </div>
        </div>
      </div>
    </div>
  );
}

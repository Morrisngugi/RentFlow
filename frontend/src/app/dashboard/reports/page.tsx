'use client';

import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch reports from API
    setLoading(false);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Performance Reports</h1>
        <p className="text-gray-600 text-lg">View analytics and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm font-medium">Total Properties Managed</p>
          <p className="text-4xl font-bold text-rentflow-blue mt-2">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm font-medium">Active Tenants</p>
          <p className="text-4xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm font-medium">Collection Rate</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">0%</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-600">Chart coming soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-600">Chart coming soon</p>
          </div>
        </div>
      </div>

      {/* Report Export */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-rentflow-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            📊 Export to Excel
          </button>
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            📄 Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}

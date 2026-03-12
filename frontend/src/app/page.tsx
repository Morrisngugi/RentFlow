'use client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏠 RentFlow
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Property Rental Management System
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">🔐 Authentication</h2>
            <p className="text-gray-600">Secure login and registration</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">📋 Properties</h2>
            <p className="text-gray-600">Manage your rental properties</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">💰 Payments</h2>
            <p className="text-gray-600">Track rental payments</p>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500 mb-2">
            API Status: <span className="text-green-600 font-semibold">Connected</span>
          </p>
          <p className="text-xs text-gray-400">
            API URL: {process.env.NEXT_PUBLIC_API_URL}
          </p>
        </div>
      </div>
    </main>
  );
}

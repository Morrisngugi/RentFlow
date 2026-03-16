'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LeasesPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow py-4 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Leases</h1>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
            Back to Dashboard
          </Link>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leases Management</h2>
          <p className="text-gray-600">Feature coming soon...</p>
        </div>
      </div>
    </div>
  );
}
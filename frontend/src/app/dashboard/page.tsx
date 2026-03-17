'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Fetch user profile
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load profile');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">RentFlow</h1>
              <p className="text-xs text-gray-500 mt-1">
                {isAdmin ? 'Admin' : isAgent ? 'Agent' : user?.role || 'User'} Dashboard
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600">{user?.email}</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        {/* ADMIN DASHBOARD */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/agents">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-semibold text-gray-800">Manage Agents</h3>
                <p className="text-gray-600 text-sm mt-2">View and add agents to the system</p>
              </div>
            </Link>

            <Link href="/profile">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="text-lg font-semibold text-gray-800">Profile Settings</h3>
                <p className="text-gray-600 text-sm mt-2">Update your password and profile</p>
              </div>
            </Link>
          </div>
        )}

        {/* AGENT DASHBOARD */}
        {isAgent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/properties">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">🏠</div>
                <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
                <p className="text-gray-600 text-sm mt-2">View all properties</p>
              </div>
            </Link>

            <Link href="/landlords">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="text-lg font-semibold text-gray-800">Landlords</h3>
                <p className="text-gray-600 text-sm mt-2">Manage landlords</p>
              </div>
            </Link>

            <Link href="/leases">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">📄</div>
                <h3 className="text-lg font-semibold text-gray-800">Leases</h3>
                <p className="text-gray-600 text-sm mt-2">Manage leases</p>
              </div>
            </Link>

            <Link href="/payments">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-lg font-semibold text-gray-800">Payments</h3>
                <p className="text-gray-600 text-sm mt-2">Track payments</p>
              </div>
            </Link>

            <Link href="/complaints">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-800">Complaints</h3>
                <p className="text-gray-600 text-sm mt-2">View complaints</p>
              </div>
            </Link>

            <Link href="/notifications">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">🔔</div>
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                <p className="text-gray-600 text-sm mt-2">Check notifications</p>
              </div>
            </Link>

            <Link href="/tenants">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">👨‍👩‍👧</div>
                <h3 className="text-lg font-semibold text-gray-800">Tenants</h3>
                <p className="text-gray-600 text-sm mt-2">Manage tenants</p>
              </div>
            </Link>

            <Link href="/profile">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
                <p className="text-gray-600 text-sm mt-2">Edit profile</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
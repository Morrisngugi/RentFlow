'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    // Load mock agent data
    setAgents([
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
        status: 'Active',
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
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  // Show admin agents view if admin, otherwise show regular dashboard
  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Page Header - Centered with Subtitle */}
        <div className="flex flex-col items-center text-center mb-8 md:grid md:grid-cols-3 md:items-center gap-2 md:gap-0">
          <div className="hidden md:block"></div>
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 bg-clip-text text-transparent break-words leading-tight">
              Agents
            </h1>
            <p className="text-gray-600 mt-2 text-base md:text-lg">Manage property management agents</p>
            {/* Mobile Add Agent Button */}
            <div className="mt-4 md:hidden">
              <button
                onClick={() => router.push('/dashboard/agents/add')}
                className="w-full px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Agent
              </button>
            </div>
          </div>
          {/* Desktop Add Agent Button */}
          <div className="hidden md:flex justify-end items-center">
            <button
              onClick={() => router.push('/dashboard/agents/add')}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Agent
            </button>
          </div>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/50">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-5xl">👨‍💼</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agents Yet</h2>
            <p className="text-gray-600 mb-6">Get started by adding your first agent to manage properties</p>
            <button
              onClick={() => router.push('/dashboard/agents/add')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition"
            >
              Create First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-white/50 cursor-pointer hover:-translate-y-1 group"
                onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md group-hover:shadow-lg transition-shadow">
                    {getInitials(agent.name)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {agent.name}
                      </h3>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Created {agent.createdAt}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Email:</span>
                    <span className="text-gray-900 font-medium truncate">{agent.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Phone:</span>
                    <span className="text-gray-900 font-medium">{agent.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular user dashboard (non-admin)
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-600 text-lg">Property Management System</p>
      </div>

      {/* Main Grid - Cards in Uniform Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Properties Card */}
        <Link href="/dashboard/properties">
          <div className="group h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border-t-4 border-blue-600 hover:translate-y-[-2px]">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">🏠</div>
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-600 transition-colors flex items-center justify-center">
                <span className="text-lg group-hover:text-white text-blue-600 font-bold">→</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Properties</h3>
            <p className="text-gray-600 text-sm">Manage all properties in your portfolio</p>
          </div>
        </Link>

        {/* Tenants Card */}
        <Link href="/dashboard/tenants">
          <div className="group h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border-t-4 border-green-600 hover:translate-y-[-2px]">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">👥</div>
              <div className="w-10 h-10 rounded-full bg-green-100 group-hover:bg-green-600 transition-colors flex items-center justify-center">
                <span className="text-lg group-hover:text-white text-green-600 font-bold">→</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Tenants</h3>
            <p className="text-gray-600 text-sm">Manage tenant information and records</p>
          </div>
        </Link>

        {/* Leases Card */}
        <Link href="/dashboard/leases">
          <div className="group h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border-t-4 border-purple-600 hover:translate-y-[-2px]">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">📄</div>
              <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-600 transition-colors flex items-center justify-center">
                <span className="text-lg group-hover:text-white text-purple-600 font-bold">→</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Leases</h3>
            <p className="text-gray-600 text-sm">View and manage active leases</p>
          </div>
        </Link>

        {/* Payments Card */}
        <Link href="/dashboard/payments">
          <div className="group h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border-t-4 border-orange-600 hover:translate-y-[-2px]">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">💰</div>
              <div className="w-10 h-10 rounded-full bg-orange-100 group-hover:bg-orange-600 transition-colors flex items-center justify-center">
                <span className="text-lg group-hover:text-white text-orange-600 font-bold">→</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Payments</h3>
            <p className="text-gray-600 text-sm">Track rental payments and income</p>
          </div>
        </Link>
      </div>

      {/* Overview Section with Proper Whitespace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8 border-l-4 border-gray-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">Dashboard Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-600">
              <div className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Total Properties</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">0</div>
              <p className="text-xs text-gray-600">Active properties in system</p>
            </div>
            
            {/* Stat Card 2 */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-l-4 border-green-600">
              <div className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Active Leases</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">0</div>
              <p className="text-xs text-gray-600">Current active leases</p>
            </div>
            
            {/* Stat Card 3 */}
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-l-4 border-orange-600">
              <div className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Pending Payments</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">0</div>
              <p className="text-xs text-gray-600">Overdue or due soon</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/properties">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold transition-colors border-l-4 border-blue-600">
                ➕ Add Property
              </button>
            </Link>
            <Link href="/dashboard/tenants">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-900 font-semibold transition-colors border-l-4 border-green-600">
                ➕ Add Tenant
              </button>
            </Link>
            <Link href="/dashboard/leases">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold transition-colors border-l-4 border-purple-600">
                ➕ Create Lease
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

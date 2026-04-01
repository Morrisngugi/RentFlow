'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

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
    // Redirect based on role
    if (user?.role === 'tenant') {
      router.replace('/dashboard/tenant-home');
      return;
    }

    if (user?.role === 'landlord') {
      router.replace('/dashboard/landlord-home');
      return;
    }

    if (user?.role === 'agent') {
      router.replace('/dashboard/agent-home');
      return;
    }

    // Fetch agents from database if admin
    if (user?.role === 'admin') {
      fetchAgents();
    }
  }, [user]);

  const fetchAgents = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const endpoint = `${API_URL}/agents`;
      
      console.log(`🔄 Fetching agents from: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log(`📊 Agent endpoint response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully fetched ${data.data?.length || 0} agents`, data);
        const agentList = data.data ? data.data.map((agent: any) => ({
          id: agent.id || agent.userId,
          name: `${agent.firstName} ${agent.lastName}`,
          email: agent.email,
          phone: agent.phoneNumber,
          status: agent.isActive ? 'Active' : 'Inactive',
          createdAt: new Date(agent.createdAt).toLocaleDateString(),
        })) : [];
        setAgents(agentList);
        console.log(`📋 Displaying ${agentList.length} agents on dashboard`);
      } else {
        // Log the error response for debugging
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
        } catch (e) {
          errorDetails = await response.text();
        }
        console.error(`❌ Agent endpoint error (${response.status}):`, errorDetails);
        // Show empty list instead of mock data - API call succeeded but no agents exist
        setAgents([]);
      }
    } catch (error) {
      console.error('❌ Network error fetching agents:', error);
      // Still show empty list on network error - we can retry
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

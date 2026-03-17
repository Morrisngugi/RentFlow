'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  idNumber: string;
  officeName: string;
  officeLocation: string;
  status: string;
  createdAt: string;
}

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = (params?.id as string) || '';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Load mock agent data based on ID
    const mockAgents: Record<string, Agent> = {
      '1': {
        id: '1',
        firstName: 'John',
        lastName: 'Kariuki',
        email: 'john.kariuki@example.com',
        phoneNumber: '0722111222',
        idNumber: '1234567890',
        officeName: 'Nairobi Central Office',
        officeLocation: 'Nairobi, Kenya',
        status: 'Active',
        createdAt: '2/28/2026',
      },
      '2': {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Omondi',
        email: 'sarah.omondi@example.com',
        phoneNumber: '0733222333',
        idNumber: '1234567891',
        officeName: 'Westlands Branch',
        officeLocation: 'Westlands, Nairobi',
        status: 'Active',
        createdAt: '3/5/2026',
      },
      '3': {
        id: '3',
        firstName: 'Michael',
        lastName: 'Kipchoge',
        email: 'michael.kip@example.com',
        phoneNumber: '0701333444',
        idNumber: '1234567892',
        officeName: 'Karen Office',
        officeLocation: 'Karen, Nairobi',
        status: 'Active',
        createdAt: '3/1/2026',
      },
    };

    const selectedAgent = mockAgents[agentId];
    if (selectedAgent) {
      setAgent(selectedAgent);
    } else {
      setError('Agent not found');
    }
    setLoading(false);
  }, [agentId]);

  const handleEdit = () => {
    router.push(`/dashboard/agents/${agentId}/edit`);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading agent details...</div>;
  }

  if (error || !agent) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium mb-4">{error || 'Agent not found'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-rentflow-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {agent.firstName} {agent.lastName}
          </h1>
          <p className="text-gray-600 text-lg">Agent Profile & Details</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-rentflow-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Agent</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {agent.firstName} {agent.lastName}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Status */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white text-6xl font-bold mx-auto mb-6 shadow-lg">
              {agent.firstName[0]}
              {agent.lastName[0]}
            </div>

            {/* Status Badge */}
            <div className="text-center mb-6">
              <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                {agent.status}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium rounded-lg transition-colors">
                View Properties
              </button>
              <button className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-900 font-medium rounded-lg transition-colors">
                View Tenants
              </button>
              <button className="w-full px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 font-medium rounded-lg transition-colors">
                View Payments
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Personal Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">First Name</p>
                  <p className="text-lg text-gray-900">{agent.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Last Name</p>
                  <p className="text-lg text-gray-900">{agent.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Email Address</p>
                  <p className="text-lg text-gray-900">{agent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Phone Number</p>
                  <p className="text-lg text-gray-900">{agent.phoneNumber}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 font-semibold mb-1">ID Number</p>
                  <p className="text-lg text-gray-900">{agent.idNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Office Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Office Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Office Name</p>
                  <p className="text-lg text-gray-900">{agent.officeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Office Location</p>
                  <p className="text-lg text-gray-900">{agent.officeLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Activity</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Created Date</p>
                <p className="text-lg text-gray-900">{agent.createdAt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

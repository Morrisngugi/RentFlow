'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface PropertyWithUnits {
  id: string;
  name: string;
  address: string;
  city: string;
  propertyType: string;
  unitsCount: number;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  idNumber: string;
  officeName: string;
  officeLocation: string;
  isActive: boolean;
  propertiesManaged?: number;
  propertyDetails?: PropertyWithUnits[];
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
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}?detailed=true`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Agent not found');
        }

        const responseData = await response.json();
        setAgent(responseData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  const handleEdit = () => {
    router.push(`/dashboard/agents/${agentId}/edit`);
  };

  const handleToggleStatus = async () => {
    if (!agent) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }

      const responseData = await response.json();
      setAgent(responseData.data);
      setShowDeactivateConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent status');
    } finally {
      setActionLoading(false);
    }
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

      router.push('/dashboard/agents');
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

  const status = agent.isActive ? 'Active' : 'Inactive';

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
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Page Header with Better Action Buttons */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {agent.firstName} {agent.lastName}
            </h1>
            <p className="text-gray-600 text-lg">Agent Profile & Details</p>
          </div>
          <div className="text-right">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              agent.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Action Buttons Row - Always Visible & Prominent */}
        <div className="flex gap-4 flex-wrap bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-300 mb-6 shadow-md z-10 relative">
          <button
            onClick={handleEdit}
            style={{ backgroundColor: '#007bff' }}
            className="px-10 py-4 bg-rentflow-blue text-white rounded-lg font-bold text-base hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-lg border-2 border-rentflow-blue"
          >
            ✏️ Edit Agent
          </button>
          <button
            onClick={() => setShowDeactivateConfirm(true)}
            disabled={actionLoading}
            className={`px-10 py-4 rounded-lg font-bold text-base transition-all duration-200 flex items-center gap-2 shadow-lg border-2 ${
              agent.isActive
                ? 'bg-orange-100 border-orange-500 text-orange-800 hover:bg-orange-200 hover:shadow-xl active:scale-95'
                : 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200 hover:shadow-xl active:scale-95'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {agent.isActive ? '🔒 Deactivate' : '🔓 Activate'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-10 py-4 bg-red-100 border-2 border-red-500 text-red-800 rounded-lg font-bold text-base hover:bg-red-200 hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            🗑️ Delete Agent
          </button>
        </div>
      </div>

      {/* Deactivate Confirmation Dialog - Always Visible */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] rounded-lg !visible opacity-100">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md border-2 border-blue-500 transform scale-100 !visible opacity-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {agent.isActive ? 'Deactivate Agent' : 'Activate Agent'}
              </h2>
            </div>
            <p className="text-gray-700 mb-8 leading-relaxed font-medium">
              {agent.isActive
                ? `Are you sure you want to deactivate ${agent.firstName} ${agent.lastName}? They will no longer be able to access the system.`
                : `Are you sure you want to activate ${agent.firstName} ${agent.lastName}? They will be able to access the system again.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-rentflow-blue text-white rounded-lg font-bold hover:bg-blue-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 !visible opacity-100"
              >
                {actionLoading ? 'Processing...' : agent.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 border-2 border-gray-400 text-gray-900 rounded-lg font-bold hover:bg-gray-50 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed !visible opacity-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog - Always Visible */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] rounded-lg !visible opacity-100">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md border-2 border-red-500 transform scale-100 !visible opacity-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Delete Agent</h2>
            </div>
            <p className="text-gray-700 mb-8 leading-relaxed font-medium">
              Are you sure you want to delete {agent.firstName} {agent.lastName}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 hover:shadow-lg transition-all duration-200 border-2 border-red-700 !visible opacity-100"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-400 text-gray-900 rounded-lg font-bold hover:bg-gray-50 hover:shadow-lg transition-all duration-200 !visible opacity-100"
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
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                agent.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status}
              </span>
            </div>

            {/* Properties Statistics */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {agent.propertiesManaged || 0}
              </div>
              <div className="text-sm text-gray-600">Properties Managed</div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium rounded-lg transition-colors">
                View Tenants
              </button>
              <button className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-900 font-medium rounded-lg transition-colors">
                View Payments
              </button>
              <button className="w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium rounded-lg transition-colors">
                View Complaints
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
                <p className="text-lg text-gray-900">{new Date(agent.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Properties Managed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              Properties Managed ({agent.propertiesManaged || 0})
            </h2>
            
            {agent.propertyDetails && agent.propertyDetails.length > 0 ? (
              <div className="space-y-4">
                {agent.propertyDetails.map(property => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{property.address}, {property.city}</p>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {property.propertyType}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-rentflow-blue mb-1">{property.unitsCount}</div>
                        <div className="text-xs text-gray-600">Units</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No properties managed by this agent yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

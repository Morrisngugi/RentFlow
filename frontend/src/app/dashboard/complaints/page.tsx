'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { Complaint } from '@/lib/types';

export default function ComplaintsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lease, setLease] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    complaintType: 'maintenance' | 'billing' | 'safety' | 'noise' | 'other';
  }>({
    title: '',
    description: '',
    complaintType: 'maintenance',
  });

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch lease first
      const leaseData = await apiClient.getTenantLeases(user.id);
      if (leaseData && leaseData.length > 0) {
        setLease(leaseData[0]);
      }

      // Fetch complaints - ensure it's an array
      const complaintData = await apiClient.getMyComplaints();
      setComplaints(Array.isArray(complaintData) ? complaintData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lease?.id) {
      alert('No active lease found. Please contact support.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const newComplaint = await apiClient.createComplaint({
        leaseId: lease.id,
        title: formData.title,
        description: formData.description,
        complaintType: formData.complaintType,
      });

      setComplaints([newComplaint, ...complaints]);
      setFormData({ title: '', description: '', complaintType: 'maintenance' });
      setShowForm(false);
      alert('Complaint submitted successfully!');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Error submitting complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplaintIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'billing':
        return '💵';
      case 'safety':
        return '🚨';
      case 'noise':
        return '🔊';
      default:
        return '⚠️';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Complaints</h1>
          <p className="text-gray-600 text-lg">Report issues or damages in your rental unit</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
        >
          {showForm ? 'Cancel' : '+ New Complaint'}
        </button>
      </div>

      {/* Complaint Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit a Complaint</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Complaint Type</label>
              <select
                value={formData.complaintType}
                onChange={(e) =>
                  setFormData({ ...formData, complaintType: e.target.value as Complaint['complaintType'] })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="maintenance">🔧 Maintenance</option>
                <option value="billing">💵 Billing</option>
                <option value="safety">🚨 Safety</option>
                <option value="noise">🔊 Noise</option>
                <option value="other">⚠️ Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about the issue"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Complaints</h2>

        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">No complaints submitted yet</p>
            <p className="text-gray-500 mt-2">Submit your first complaint to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl">{getComplaintIcon(complaint.complaintType)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{complaint.title}</h3>
                      <p className="text-gray-600 mt-1">{complaint.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm text-gray-500">
                          Submitted: {formatDate(complaint.createdAt)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(complaint.status)}`}>
                          {complaint.status === 'in_progress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

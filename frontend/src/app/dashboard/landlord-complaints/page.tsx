'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api';

interface ComplaintData {
  id: string;
  title: string;
  description: string;
  complaintType?: string;
  type?: string;
  status: string;
  property: { id: string; name: string } | null;
  tenant: any | null;
  lease: { id: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function LandlordComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintIdFromUrl = searchParams?.get('complaintId') || null;
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      if (userData.role !== 'landlord') {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [statusFilter, pagination.offset, user]);

  // Auto-open complaint from URL query parameter
  useEffect(() => {
    if (complaintIdFromUrl && complaints.length > 0) {
      const complaint = complaints.find((c) => c.id === complaintIdFromUrl);
      if (complaint) {
        handleComplaintClick(complaint);
      }
    }
  }, [complaintIdFromUrl, complaints]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getLandlordComplaints(pagination.limit, pagination.offset);
      let fetchedComplaints = response.complaints || [];

      // Map lease.property and tenant details for easier access
      fetchedComplaints = fetchedComplaints.map((complaint: any) => {
        const tenant = complaint.tenant;
        const tenantName = tenant ? `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() : null;
        
        return {
          ...complaint,
          property: complaint.lease?.property || null,
          tenant: tenant ? {
            id: tenant.id,
            name: tenantName || 'Unknown',
            email: tenant.email || 'N/A',
            phone: tenant.phoneNumber || 'N/A',
          } : null,
        };
      });

      if (statusFilter !== 'all') {
        fetchedComplaints = fetchedComplaints.filter((c: ComplaintData) => c.status === statusFilter);
      }

      setComplaints(fetchedComplaints);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintClick = async (complaint: ComplaintData) => {
    setSelectedComplaint(complaint);
    setRepliesLoading(true);
    try {
      const fetchedReplies = await apiClient.getComplaintReplies(complaint.id);
      setReplies(fetchedReplies || []);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      setReplies([]);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyMessage.trim()) return;

    setRepliesLoading(true);
    try {
      await apiClient.replyToComplaint(selectedComplaint.id, replyMessage);
      const updatedReplies = await apiClient.getComplaintReplies(selectedComplaint.id);
      setReplies(updatedReplies || []);
      setReplyMessage('');
      setShowReplyForm(false);
      // Update local complaint status to in_progress since it was just replied to
      setSelectedComplaint({ ...selectedComplaint, status: 'in_progress' });
      setComplaints(complaints.map(c => c.id === selectedComplaint.id ? { ...c, status: 'in_progress' } : c));
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedComplaint) return;
    setPendingStatusChange(newStatus);
    setShowStatusConfirmation(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedComplaint || !pendingStatusChange) return;

    setStatusUpdating(true);
    try {
      const response = await apiClient.updateComplaintStatusAsAgent(
        selectedComplaint.id,
        pendingStatusChange as 'open' | 'in_progress' | 'resolved' | 'closed'
      );
      
      // Merge the response with existing complaint data to preserve all properties
      const updatedComplaint = { ...selectedComplaint, ...response };
      
      // Update local state with merged data
      setSelectedComplaint(updatedComplaint);
      setComplaints(
        complaints.map((c) =>
          c.id === selectedComplaint.id ? updatedComplaint : c
        )
      );
      
      // Refresh the full list from backend to ensure sync
      await fetchComplaints();
      
      setShowStatusConfirmation(false);
      setPendingStatusChange(null);
    } catch (error) {
      console.error('Failed to update complaint status:', error);
    } finally {
      setStatusUpdating(false);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'billing':
        return '💰';
      case 'safety':
        return '🛡️';
      case 'noise':
        return '🔊';
      default:
        return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaints Management</h1>
          <p className="text-gray-600">View and manage complaints from your properties</p>
        </div>

        {/* Stats and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-red-600">
                {complaints.filter((c) => c.status === 'open').length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {complaints.filter((c) => c.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {complaints.filter((c) => c.status === 'resolved').length}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{pagination.total}</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPagination({ ...pagination, offset: 0 });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              <p className="text-gray-600 mt-2">Loading complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleComplaintClick(complaint)}
                    >
                      <td className="px-6 py-4 text-2xl">{getTypeIcon(complaint.complaintType || complaint.type || 'other')}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 line-clamp-1">{complaint.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{complaint.property?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{complaint.tenant?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{complaint.tenant?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplaintClick(complaint);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && complaints.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Complaint Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {getTypeIcon(selectedComplaint.complaintType || selectedComplaint.type || 'other')} {(selectedComplaint.complaintType || selectedComplaint.type || 'unknown')?.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedComplaint(null);
                    setReplies([]);
                    setReplyMessage('');
                    setShowReplyForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4">
                {/* Complaint Details */}
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedComplaint.title}</h3>
                    <p className="text-sm text-gray-700 mb-3">{selectedComplaint.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <p className="text-gray-500">Property</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.property?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tenant</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.tenant?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tenant Email</p>
                        <p className="font-medium text-gray-900 break-all">{selectedComplaint.tenant?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tenant Phone</p>
                        <p className="font-medium text-gray-900">{selectedComplaint.tenant?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Complaint Type</p>
                        <p className="font-medium text-gray-900 capitalize">{(selectedComplaint.complaintType || selectedComplaint.type || 'N/A').replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500">Date Submitted</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Update Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Change Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(status)}
                            disabled={statusUpdating || selectedComplaint.status === status}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              selectedComplaint.status === status
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : status === 'resolved'
                                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                : status === 'closed'
                                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                : status === 'in_progress'
                                ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                          >
                            {statusUpdating && selectedComplaint.status !== status ? '...' : status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-6" />

                {/* Replies Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Replies ({replies.length})</h4>

                  {repliesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                    </div>
                  ) : replies.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No replies yet</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {reply.user?.name || 'Landlord'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Send Reply</h4>
                  {!showReplyForm ? (
                    <button
                      onClick={() => setShowReplyForm(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Write Reply
                    </button>
                  ) : (
                    <form onSubmit={handleSendReply} className="space-y-3">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        rows={4}
                        disabled={repliesLoading}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={repliesLoading || !replyMessage.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          {repliesLoading ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReplyForm(false);
                            setReplyMessage('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      {showStatusConfirmation && pendingStatusChange && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 bg-yellow-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to change the complaint status to <span className="font-semibold">{pendingStatusChange.replace('_', ' ')}</span>?
              </p>
              <p className="text-sm text-gray-600">
                This action will update the database and the tenant will receive a notification about this status change.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusConfirmation(false);
                  setPendingStatusChange(null);
                }}
                disabled={statusUpdating}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={statusUpdating}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {statusUpdating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Notification } from '@/lib/types';

interface NotificationBellProps {
  userRole?: string;
}

interface Complaint {
  id: number;
  title: string;
  description: string;
  tenantId: number;
  propertyId: number;
  status: string;
  createdAt: string;
  tenant?: { name: string; email: string };
  property?: { name: string };
}

interface ComplaintReply {
  id: number;
  message: string;
  user?: { name: string; email: string };
  createdAt: string;
}

export default function NotificationBell({ userRole }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintReplies, setComplaintReplies] = useState<ComplaintReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getNotifications();
      setNotifications(data);
      const unread = data.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle complaint notification click
  const handleOpenComplaintModal = async (notification: Notification) => {
    if (!notification.relatedEntityId) return;

    setRepliesLoading(true);
    try {
      // Fetch complaint details
      const complaintId = parseInt(notification.relatedEntityId);
      const response = await apiClient.getAgentComplaints(1000);
      const complaints = response.complaints || [];
      const complaint = complaints.find((c: any) => c.id === complaintId);

      if (complaint) {
        setSelectedComplaint(complaint);
        
        // Fetch replies for this complaint
        const replies = await apiClient.getComplaintReplies(complaintId.toString());
        setComplaintReplies(replies);
      }

      // Mark notification as read
      await handleMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to open complaint modal:', error);
    } finally {
      setRepliesLoading(false);
    }
  };

  // Handle sending reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyMessage.trim()) return;

    setReplyLoading(true);
    try {
      await apiClient.replyToComplaint(selectedComplaint.id.toString(), replyMessage);
      
      // Refresh replies
      const updatedReplies = await apiClient.getComplaintReplies(selectedComplaint.id.toString());
      setComplaintReplies(updatedReplies);
      
      // Clear input
      setReplyMessage('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_generated':
        return '📄';
      case 'payment_received':
        return '💰';
      case 'complaint_received':
        return '⚠️';
      default:
        return '📬';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            fetchNotifications();
          }
        }}
        className="relative flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors z-[91]"
        aria-label="Notifications"
        title="Invoice Notifications"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-[100]"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[110]">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-600 mt-1">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  <div className="text-3xl mb-2">📭</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-lg mt-0.5">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        
                        {/* Action Buttons */}
                        {notification.notificationType === 'invoice_generated' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                                router.push('/dashboard/invoices');
                                setShowDropdown(false);
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition-colors"
                            >
                              View Invoice
                            </button>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded font-medium transition-colors"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        )}

                        {notification.notificationType === 'complaint_received' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenComplaintModal(notification);
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-medium transition-colors"
                            >
                              View & Reply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-center">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Complaint Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  From: {selectedComplaint!.tenant?.name || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setComplaintReplies([]);
                  setReplyMessage('');
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
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedComplaint!.title}</h3>
                  <p className="text-sm text-gray-700 mb-3">{selectedComplaint!.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>📍 {selectedComplaint!.property?.name || 'Unknown Property'}</span>
                    <span>📧 {selectedComplaint!.tenant?.email || 'N/A'}</span>
                    <span>
                      🕐 {new Date(selectedComplaint!.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6" />

              {/* Replies Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Replies ({complaintReplies.length})</h4>
                
                {repliesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                  </div>
                ) : complaintReplies.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No replies yet</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {complaintReplies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {reply.user?.name || 'Agent'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    rows={4}
                    disabled={replyLoading}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={replyLoading || !replyMessage.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      {replyLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplaint(null);
                        setComplaintReplies([]);
                        setReplyMessage('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

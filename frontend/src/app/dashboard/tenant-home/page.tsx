'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';

interface Lease {
  id: string;
  monthlyRent: number;
  securityFee: number;
  garbageAmount: number;
  rentDueDate: number;
  propertyId: string;
}

interface MonthlyBreakdown {
  id: string;
  month: number;
  year: number;
  baseRent: number;
  waterCharges: number;
  garbageCharges: number;
  securityFee: number;
  totalDue: number;
  amountPaid: number;
  status: 'pending' | 'partial' | 'paid' | 'overpaid';
  dueDate: string;
}

interface Payment {
  id: string;
  amount: number;
  paidDate: string;
  paymentMethod: string;
  status: string;
}

export default function TenantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lease, setLease] = useState<Lease | null>(null);
  const [currentBreakdown, setCurrentBreakdown] = useState<MonthlyBreakdown | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTenantData();
    }
  }, [user]);

  const fetchTenantData = async () => {
    try {
      if (!user?.id) return;

      // Fetch lease
      const leases = await apiClient.getTenantLeases(user.id);
      if (leases && leases.length > 0) {
        const leaseData = leases[0];
        setLease(leaseData);

        if (leaseData?.id) {
          // Fetch current month breakdown
          const now = new Date();
          const breakdownData = await apiClient.getMonthlyBreakdown(
            leaseData.id,
            now.getMonth() + 1,
            now.getFullYear()
          );
          if (breakdownData) {
            setCurrentBreakdown(breakdownData);
          }

          // Fetch payment history
          const paymentData = await apiClient.getPaymentHistory(leaseData.id);
          setPaymentHistory(paymentData);
        }
      }
    } catch (err) {
      console.error('Error fetching tenant data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'overpaid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'Tenant'}
        </h1>
        <p className="text-gray-600 text-lg">Your Rental Dashboard</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      {currentBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Due */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Current Rent Due</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(Math.max(0, currentBreakdown.totalDue - currentBreakdown.amountPaid))}
                </p>
                <p className="text-red-100 text-sm mt-1">
                  Due: {formatDate(currentBreakdown.dueDate)}
                </p>
              </div>
              <div className="text-5xl opacity-20">💰</div>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Amount Paid This Month</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(currentBreakdown.amountPaid)}</p>
                <p className="text-green-100 text-sm mt-1">
                  Status: <span className="font-semibold capitalize">{currentBreakdown.status}</span>
                </p>
              </div>
              <div className="text-5xl opacity-20">✓</div>
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Bill</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(currentBreakdown.totalDue)}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {currentBreakdown.month}/{currentBreakdown.year}
                </p>
              </div>
              <div className="text-5xl opacity-20">📄</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Invoice Breakdown */}
      {currentBreakdown && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Current Month Invoice - {currentBreakdown.month}/{currentBreakdown.year}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Base Rent</span>
              <span className="font-semibold">{formatCurrency(currentBreakdown.baseRent)}</span>
            </div>
            {currentBreakdown.securityFee > 0 && (
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Security Fee</span>
                <span className="font-semibold">{formatCurrency(currentBreakdown.securityFee)}</span>
              </div>
            )}
            {currentBreakdown.garbageCharges > 0 && (
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Garbage Charges</span>
                <span className="font-semibold">{formatCurrency(currentBreakdown.garbageCharges)}</span>
              </div>
            )}
            {currentBreakdown.waterCharges > 0 && (
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Water Charges</span>
                <span className="font-semibold">{formatCurrency(currentBreakdown.waterCharges)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 font-bold text-lg">
              <span>Total Due</span>
              <span className="text-blue-600">{formatCurrency(currentBreakdown.totalDue)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment History</h2>
        {paymentHistory.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{formatDate(payment.paidDate)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-4 text-gray-700 capitalize">{payment.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/complaints">
            <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
              <span>⚠️</span>
              Submit Complaint
            </button>
          </Link>
          <Link href="/dashboard/profile">
            <button className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
              <span>👤</span>
              View Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';

interface Payment {
  id: string;
  leaseId?: string;
  property?: string;
  tenant?: string;
  amount: number;
  amountPaid?: number;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial' | 'overpaid';
}

export default function PaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  // Auto-refresh payments every 5 seconds to reflect agent payment updates
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchPayments();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPayments();
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPayments = async () => {
    try {
      if (user.role === 'tenant') {
        // For tenants, fetch ALL invoices (not just current month) to show all payments
        const result = await apiClient.getTenantInvoices(user.id, 1000, 0);
        const invoices = result.invoices || [];
        
        // Convert invoices to Payment format to calculate stats and display
        const allPayments: Payment[] = invoices.map((invoice: any) => {
          let status: 'paid' | 'pending' | 'overdue' = 'pending';
          if (invoice.amountPaid >= invoice.totalDue) {
            status = 'paid';
          } else if (new Date(invoice.dueDate) < new Date() && invoice.amountPaid < invoice.totalDue) {
            status = 'overdue';
          }

          return {
            id: invoice.id,
            leaseId: invoice.leaseId,
            property: invoice.property,
            tenant: invoice.tenant,
            amount: invoice.totalDue,
            amountPaid: invoice.amountPaid,
            dueDate: invoice.dueDate,
            paidDate: invoice.amountPaid > 0 ? invoice.updatedAt || new Date().toISOString() : undefined,
            paymentMethod: invoice.amountPaid > 0 ? 'recorded' : undefined,
            status: status,
          };
        });

        setPayments(allPayments);
      } else if (user.role === 'landlord') {
        // For landlords, fetch all tenant payments from their properties
        const allPayments = await apiClient.getLandlordPayments?.() || [];
        setPayments(allPayments);
      } else if (user.role === 'agent') {
        // For agents, fetch all payments for properties they manage
        const allPayments = await apiClient.getAgentPayments?.() || [];
        setPayments(allPayments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const stats = {
      totalExpected: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
    };

    payments.forEach((payment) => {
      const totalDue = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
      const amountPaid = typeof payment.amountPaid === 'string' ? parseFloat(payment.amountPaid || '0') : (payment.amountPaid || 0);
      const balanceRemaining = totalDue - amountPaid;

      stats.totalExpected += totalDue;
      // Always count all payments made (including partial payments)
      stats.paid += amountPaid;

      if (payment.status === 'paid') {
        // Fully paid - nothing to add to pending/overdue
      } else if (payment.status === 'pending') {
        stats.pending += balanceRemaining;
      } else if (payment.status === 'overdue') {
        // Overdue unpaid amounts count towards BOTH pending and overdue
        stats.pending += balanceRemaining;
        stats.overdue += balanceRemaining;
      }
    });

    return stats;
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    if (filter === 'paid') {
      // Paid filter shows items that have ANY amount paid (even if status is overdue/pending)
      const amountPaid = typeof payment.amountPaid === 'string' ? parseFloat(payment.amountPaid || '0') : (payment.amountPaid || 0);
      return amountPaid > 0;
    }
    if (filter === 'pending') {
      // Pending filter shows both pending and overdue (unpaid items)
      return payment.status === 'pending' || payment.status === 'overdue';
    }
    if (filter === 'overdue') {
      // Overdue filter shows only overdue
      return payment.status === 'overdue';
    }
    return payment.status === filter;
  });

  const stats = calculateStats();
  const formatCurrency = (amount: number | string) => {
    // Convert to number and remove any leading zeros
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KES ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Tracking</h1>
          <p className="text-gray-600 text-lg">
            {user?.role === 'tenant'
              ? 'Your rental payment history'
              : user?.role === 'landlord'
              ? 'Monitor rental payments and income'
              : 'Track payments for managed properties'}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          title="Refresh payment data"
        >
          {refreshing ? '⟳' : '🔄'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
          <p className="text-gray-600 text-sm font-medium">Total Expected</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalExpected)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
          <p className="text-green-600 text-sm font-medium">Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.paid)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-yellow-600">
          <p className="text-yellow-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{formatCurrency(stats.pending)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600">
          <p className="text-red-600 text-sm font-medium">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(stats.overdue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'paid', 'pending', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-gray-600 text-lg">
              {payments.length === 0 ? 'No payments found' : `No ${filter} payments`}
            </p>
            {payments.length === 0 && user?.role === 'tenant' && (
              <p className="text-gray-500 text-sm mt-2">Your payment history will appear here once you have lease payments.</p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {(user?.role === 'landlord' || user?.role === 'agent') && (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Property</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tenant</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount Due</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Paid Date</th>
                {user?.role === 'tenant' && (
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
                )}
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                // Calculate amount to display based on payment status
                const totalDue = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
                const amountPaid = typeof payment.amountPaid === 'string' ? parseFloat(payment.amountPaid || '0') : (payment.amountPaid || 0);
                const balanceRemaining = totalDue - amountPaid;
                
                // Show balance remaining for unpaid items, amount paid for paid items
                const displayAmount = payment.status === 'paid' ? amountPaid : balanceRemaining;
                
                return (
                  <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {(user?.role === 'landlord' || user?.role === 'agent') && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-900">{payment.property || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.tenant || '-'}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(displayAmount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.dueDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                    </td>
                    {user?.role === 'tenant' && (
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.paymentMethod ? (
                          <>
                            {payment.paymentMethod === 'bank_transfer' && '🏦'}
                            {payment.paymentMethod === 'mobile_money' && '📱'}
                            {payment.paymentMethod === 'cash' && '💵'}
                            {payment.paymentMethod === 'cheque' && '📄'}
                            {payment.paymentMethod === 'recorded' && '✓'}
                            {' ' + payment.paymentMethod.replace('_', ' ')}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

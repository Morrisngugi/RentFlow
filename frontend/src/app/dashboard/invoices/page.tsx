'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';

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

interface Lease {
  id: string;
  monthlyRent: number;
  securityFee: number;
  garbageAmount: number;
  rentDueDate: number;
  propertyId: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<MonthlyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyBreakdown | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [fromMonth, setFromMonth] = useState<string>('');
  const [toMonth, setToMonth] = useState<string>('');

  const apiClient = new ApiClient();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [router]);

  useEffect(() => {
    if (user) {
      setOffset(0);
      fetchInvoices(0);
    }
  }, [user, fromMonth, toMonth]);

  const fetchInvoices = async (pageOffset: number = 0) => {
    try {
      if (!user?.id) return;
      setLoading(true);

      // Convert month inputs (YYYY-MM) to the format backend expects
      const fromDate = fromMonth ? `${fromMonth}-01` : undefined;
      const toDate = toMonth ? `${toMonth}-01` : undefined;

      // Use new endpoint that only fetches available invoices
      const result = await apiClient.getTenantInvoices(user.id, limit, pageOffset, fromDate, toDate);
      
      setInvoices(result.invoices || []);
      setTotal(result.total || 0);
      setOffset(pageOffset);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KES ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓ Paid';
      case 'partial':
        return '⊘ Partial';
      case 'pending':
        return '⏳ Pending';
      case 'overpaid':
        return '✓✓ Overpaid';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Your Invoices</h1>
        <p className="text-gray-600 text-lg">View your monthly rental invoices and payment status</p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Month</label>
            <input
              type="month"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Month</label>
            <input
              type="month"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              setFromMonth('');
              setToMonth('');
            }}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
        <p className="text-gray-600 text-sm mt-3">
          Showing {invoices.length} of {total} invoices
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No invoices found</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-blue-500"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Invoice {invoice.month.toString().padStart(2, '0')}/{invoice.year}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusBadge(invoice.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-gray-600 text-sm">Total Due</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.totalDue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Amount Paid</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(invoice.amountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Balance Due</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(Math.max(0, invoice.totalDue - invoice.amountPaid))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Due Date</p>
                      <p className="text-xl font-bold text-gray-900">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoice(invoice);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between mt-8 bg-white rounded-lg shadow p-6">
          <div className="text-gray-600">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} invoices
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchInvoices(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => fetchInvoices(offset + limit)}
              disabled={offset + limit >= total}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 overflow-y-auto max-h-[calc(100vh-4rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Invoice {selectedInvoice.month.toString().padStart(2, '0')}/{selectedInvoice.year}
              </h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Invoice Breakdown */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Breakdown</h3>
                <div className="space-y-3 border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Rent</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.baseRent)}</span>
                  </div>
                  {selectedInvoice.securityFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Fee</span>
                      <span className="font-semibold">{formatCurrency(selectedInvoice.securityFee)}</span>
                    </div>
                  )}
                  {selectedInvoice.waterCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Water Charges</span>
                      <span className="font-semibold">{formatCurrency(selectedInvoice.waterCharges)}</span>
                    </div>
                  )}
                  {selectedInvoice.garbageCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Garbage Charges</span>
                      <span className="font-semibold">{formatCurrency(selectedInvoice.garbageCharges)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Total Due</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedInvoice.totalDue)}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-gray-200 pt-4">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-xl border-t border-gray-200 pt-4">
                    <span className="font-semibold text-gray-900">Balance Due</span>
                    <span className={`font-bold ${selectedInvoice.totalDue - selectedInvoice.amountPaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.max(0, selectedInvoice.totalDue - selectedInvoice.amountPaid))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Due Date */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Status</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusBadge(selectedInvoice.status)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Due Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/dashboard/payments"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  View Payment History
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

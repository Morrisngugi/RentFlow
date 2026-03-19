'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  property: string;
  tenant: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch payments from API
    setLoading(false);
  }, []);

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

  const filteredPayments = payments.filter(payment => 
    filter === 'all' ? true : payment.status === filter
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Tracking</h1>
        <p className="text-gray-600 text-lg">Monitor rental payments and income</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm font-medium">Total Expected</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">KES 0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-green-600 text-sm font-medium">Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-2">KES 0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-yellow-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">KES 0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-red-600 text-sm font-medium">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-2">KES 0</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['all', 'paid', 'pending', 'overdue'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === status
                ? 'bg-rentflow-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg">No payments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Property</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tenant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Paid Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{payment.property}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.tenant}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">KES {payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(payment.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

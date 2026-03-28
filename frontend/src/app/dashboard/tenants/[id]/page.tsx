'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface TenantProfile {
  id: string;
  userId: string;
  nationality?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  occupation?: string;
  postalAddress?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
}

interface TenantDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  idNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  tenantProfile?: TenantProfile;
}

interface Lease {
  id: string;
  monthlyRent: number | string;
  securityFee: number | string;
  garbageAmount: number | string;
  waterUnitCost: number | string;
  rentDueDate: string;
  startDate: string;
  propertyId: string;
}

interface PaymentForm {
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  previousWaterReading: number;
  currentWaterReading: number;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    previousWaterReading: 0,
    currentWaterReading: 0,
  });

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/tenants/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }

      const result = await response.json();
      const tenantData = result.data || result;
      setTenant(tenantData);
      
      // Also fetch lease information
      if (tenantData.id) {
        fetchLeaseDetails(tenantData.id);
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      toast.error('Failed to load tenant details');
      router.push('/dashboard/tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaseDetails = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/leases/by-tenant/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setLease(result.data);
      }
    } catch (error) {
      console.error('Error fetching lease details:', error);
    }
  };

  const calculateTotalRent = () => {
    if (!lease) return 0;
    const monthlyRent = parseFloat(String(lease.monthlyRent)) || 0;
    const securityFee = parseFloat(String(lease.securityFee)) || 0;
    const garbageAmount = parseFloat(String(lease.garbageAmount)) || 0;
    return monthlyRent + securityFee + garbageAmount;
  };

  const calculateWaterUnitsConsumed = () => {
    if (paymentForm.currentWaterReading < paymentForm.previousWaterReading) {
      return 0; // Invalid reading
    }
    return paymentForm.currentWaterReading - paymentForm.previousWaterReading;
  };

  const calculateWaterBill = () => {
    if (!lease) return 0;
    const waterUnitCost = parseFloat(String(lease.waterUnitCost)) || 0;
    const unitsConsumed = calculateWaterUnitsConsumed();
    return waterUnitCost * unitsConsumed;
  };

  const calculateTotalWithWater = () => {
    return calculateTotalRent() + calculateWaterBill();
  };

  const isRentDue = () => {
    if (!lease) return false;
    const today = new Date();
    const dueDate = new Date(lease.rentDueDate);
    return today >= dueDate;
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentForm.currentWaterReading < paymentForm.previousWaterReading) {
      toast.error('Current reading cannot be less than previous reading');
      return;
    }

    if (!lease) {
      toast.error('No lease information found');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/leases/${lease.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: parseFloat(String(paymentForm.amount)),
          paymentMethod: 'cash',
          paymentDate: paymentForm.paymentDate,
          month: paymentForm.month,
          year: paymentForm.year,
          waterMeterReading: {
            previousReading: paymentForm.previousWaterReading,
            currentReading: paymentForm.currentWaterReading,
            unitsConsumed: calculateWaterUnitsConsumed(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        previousWaterReading: 0,
        currentWaterReading: 0,
      });
      fetchLeaseDetails(tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Tenant not found</p>
        </div>
      </div>
    );
  }

  // Extract profile data
  const profile = tenant.tenantProfile;
  const rentStatus = lease && isRentDue() ? 'Due' : 'On Track';
  const rentStatusColor = rentStatus === 'Due' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <Link href="/dashboard/tenants">
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={20} />
            Back to Tenants
          </button>
        </Link>

        {/* Tenant Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Name and Contact */}
          <div className="border-b pb-6 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {tenant.firstName} {tenant.lastName}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg text-gray-900">{tenant.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg text-gray-900">{tenant.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">ID Number</p>
                <p className="text-lg text-gray-900">{tenant.idNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nationality</p>
                <p className="text-lg text-gray-900">{profile?.nationality || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marital Status</p>
                <p className="text-lg text-gray-900 capitalize">{profile?.maritalStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Children</p>
                <p className="text-lg text-gray-900">{profile?.numberOfChildren || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupation</p>
                <p className="text-lg text-gray-900">{profile?.occupation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Postal Address</p>
                <p className="text-lg text-gray-900">{profile?.postalAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Next of Kin Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Next of Kin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg text-gray-900">{profile?.nextOfKinName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Relationship</p>
                <p className="text-lg text-gray-900">{profile?.nextOfKinRelationship || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg text-gray-900">{profile?.nextOfKinPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg text-gray-900">
                  {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg text-gray-900">
                  {new Date(tenant.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rent Payment Status Section */}
        {lease && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Rent Details Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Rent Details</h2>
              
              {/* Rent Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Monthly Rent</span>
                  <span className="font-semibold text-gray-900">KES {parseFloat(String(lease.monthlyRent)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Security Fee</span>
                  <span className="font-semibold text-gray-900">KES {parseFloat(String(lease.securityFee)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Garbage Amount</span>
                  <span className="font-semibold text-gray-900">KES {parseFloat(String(lease.garbageAmount)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 bg-blue-50 p-4 rounded-lg">
                  <span className="text-gray-900 font-semibold">Base Monthly Rent</span>
                  <span className="text-xl font-bold text-blue-600">KES {calculateTotalRent().toLocaleString()}</span>
                </div>
              </div>

              {/* Water Meter Reading Section */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Water Meter Reading</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Previous (units)</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentForm.previousWaterReading || ''}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, previousWaterReading: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="e.g., 1000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current (units)</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentForm.currentWaterReading || ''}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, currentWaterReading: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="e.g., 1180"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-2 rounded border border-amber-200">
                    <p className="text-xs text-gray-600">Units Consumed</p>
                    <p className="text-lg font-bold text-amber-600">{calculateWaterUnitsConsumed()}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-amber-200">
                    <p className="text-xs text-gray-600">Water Bill</p>
                    <p className="text-lg font-bold text-amber-600">KES {calculateWaterBill().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Total with Water */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-lg">Total Rent Due</span>
                  <span className="text-3xl font-bold text-blue-600">KES {calculateTotalWithWater().toLocaleString()}</span>
                </div>
              </div>

              {/* Rent Due Date */}
              <div className="mb-4">
                <span className="text-gray-600 text-sm">Rent Due Date:</span>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(lease.rentDueDate).toLocaleDateString()}
                </p>
              </div>

              {/* Record Payment Button */}
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Record Payment
              </button>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment Status</h2>
              <div className={`p-6 rounded-lg mb-6 ${rentStatusColor}`}>
                <p className="text-sm font-semibold mb-2">STATUS</p>
                <p className="text-3xl font-bold">{rentStatus}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Lease Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(lease.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-gray-600 text-sm mb-3">Quick Actions</p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-lg font-semibold"
                  >
                    Make Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!lease && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">No active lease found for this tenant.</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Record Rent Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {lease && (
              <>
                {/* Rent Breakdown Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rent Breakdown</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Monthly Rent</span>
                      <span className="font-semibold">KES {calculateTotalRent().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Water Bill ({calculateWaterUnitsConsumed()} units × KES {parseFloat(String(lease.waterUnitCost)).toLocaleString()}/unit)</span>
                      <span className="font-semibold">KES {calculateWaterBill().toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-gray-900 font-bold">Total Rent Due</span>
                      <span className="text-2xl font-bold text-blue-600">KES {calculateTotalWithWater().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Amount Section */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Pay (KES)</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentForm.amount || ''}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter amount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {paymentForm.amount > 0 && (
                      <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                        {paymentForm.amount < calculateTotalWithWater() ? (
                          <div>
                            <p className="text-sm text-gray-600">Remaining Balance</p>
                            <p className="text-lg font-bold text-red-600">KES {(calculateTotalWithWater() - paymentForm.amount).toLocaleString()}</p>
                          </div>
                        ) : paymentForm.amount > calculateTotalWithWater() ? (
                          <div>
                            <p className="text-sm text-gray-600">Overpayment</p>
                            <p className="text-lg font-bold text-green-600">KES {(paymentForm.amount - calculateTotalWithWater()).toLocaleString()}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-green-600">Full Payment ✓</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={paymentForm.month}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, month: parseInt(e.target.value) || 1 })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <input
                        type="number"
                        value={paymentForm.year}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, year: parseInt(e.target.value) || new Date().getFullYear() })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold"
                  >
                    {submitting ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, CreditCard } from 'lucide-react';
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
  penalty?: number;
  additionalCharges?: number;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpdateInvoiceModal, setShowUpdateInvoiceModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false);
  const [invoiceUpdateForm, setInvoiceUpdateForm] = useState<any>({
    penaltyCharges: 0,
    electricityReconnectionFee: 0,
    waterReconnectionFee: 0,
    otherCharges: 0,
    additionalChargesDescription: '',
  });
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    previousWaterReading: 0,
    currentWaterReading: 0,
    penalty: 0,
    additionalCharges: 0,
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
        
        // Fetch current month's breakdown
        if (result.data?.id) {
          fetchCurrentBreakdown(result.data.id);
        }
      }
    } catch (error) {
      console.error('Error fetching lease details:', error);
    }
  };

  const fetchCurrentBreakdown = async (leaseId: string) => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const response = await fetch(
        `${API_URL}/leases/${leaseId}/monthly-breakdown?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBreakdown(result.data);
      } else if (response.status === 404) {
        // Breakdown doesn't exist yet - will be created on first payment
        console.log('Breakdown not yet created for this month');
        setBreakdown(null);
      }
    } catch (error) {
      console.error('Error fetching breakdown:', error);
      // Don't fail silently - breakdown will be created on first payment
      setBreakdown(null);
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

  const handleGenerateInvoice = async () => {
    if (paymentForm.currentWaterReading < paymentForm.previousWaterReading) {
      toast.error('Current reading cannot be less than previous reading');
      return;
    }

    if (!lease) {
      toast.error('No lease information found');
      return;
    }

    setGeneratingInvoice(true);
    try {
      // Calculate water bill
      const waterBill = calculateWaterBill();
      const totalDue = calculateTotalRent() + waterBill + (paymentForm.penalty || 0) + (paymentForm.additionalCharges || 0);

      // Create a dummy payment to generate/update the breakdown
      const response = await fetch(`${API_URL}/leases/${lease.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: 0, // No payment yet, just generating invoice
          paymentMethod: 'cash',
          paymentDate: paymentForm.paymentDate,
          month: paymentForm.month,
          year: paymentForm.year,
          waterMeterReading: {
            previousReading: paymentForm.previousWaterReading,
            currentReading: paymentForm.currentWaterReading,
            unitsConsumed: calculateWaterUnitsConsumed(),
          },
          penalty: paymentForm.penalty || 0,
          additionalCharges: paymentForm.additionalCharges || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate/update invoice');
      }

      const result = await response.json();
      
      // Update breakdown with invoice data
      if (result.data?.breakdown) {
        setBreakdown(result.data.breakdown);
        toast.success(isUpdatingInvoice ? 'Invoice updated successfully' : 'Invoice generated successfully');
        setIsUpdatingInvoice(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate invoice';
      toast.error(message);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleOpenInvoiceEditor = () => {
    if (breakdown) {
      // Pre-fill form with existing breakdown data
      setIsUpdatingInvoice(true);
      // Keep previous reading implicit - we'll recalculate based on current vs previous
      // For now, just set current values
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!breakdown) {
      toast.error('Please generate an invoice first');
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

      const result = await response.json();
      
      // Update breakdown immediately with response data
      if (result.data?.breakdown) {
        setBreakdown(result.data.breakdown);
      }

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        previousWaterReading: paymentForm.previousWaterReading,
        currentWaterReading: paymentForm.currentWaterReading,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPaymentModal = () => {
    if (breakdown) {
      const totalDue = parseFloat(String(breakdown.totalDue ?? 0));
      const amountPaid = parseFloat(String(breakdown.amountPaid ?? 0));
      const balanceRemaining = Math.max(0, totalDue - amountPaid);
      
      setPaymentForm({
        ...paymentForm,
        amount: balanceRemaining || 0,
      });
    }
    setShowPaymentModal(true);
  };

  const handleOpenUpdateInvoiceModal = () => {
    if (breakdown) {
      // Pre-fill form with current breakdown data
      setInvoiceUpdateForm({
        penaltyCharges: parseFloat(String(breakdown.penaltyCharges || 0)),
        electricityReconnectionFee: parseFloat(String(breakdown.electricityReconnectionFee || 0)),
        waterReconnectionFee: parseFloat(String(breakdown.waterReconnectionFee || 0)),
        otherCharges: parseFloat(String(breakdown.otherCharges || 0)),
        additionalChargesDescription: breakdown.additionalChargesDescription || '',
      });
      setShowUpdateInvoiceModal(true);
    }
  };

  const handleUpdateInvoiceCharges = async () => {
    if (!breakdown || !lease) {
      toast.error('No invoice found to update');
      return;
    }

    setSubmitting(true);
    try {
      // Recalculate total due with all charges
      const totalCharges = 
        parseFloat(String(breakdown.baseRent || 0)) +
        parseFloat(String(breakdown.waterCharges || 0)) +
        parseFloat(String(breakdown.garbageCharges || 0)) +
        parseFloat(String(breakdown.securityFee || 0)) +
        (invoiceUpdateForm.penaltyCharges || 0) +
        (invoiceUpdateForm.electricityReconnectionFee || 0) +
        (invoiceUpdateForm.waterReconnectionFee || 0) +
        (invoiceUpdateForm.otherCharges || 0);

      const response = await fetch(`${API_URL}/leases/${breakdown.id}/update-charges`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          penaltyCharges: invoiceUpdateForm.penaltyCharges || 0,
          electricityReconnectionFee: invoiceUpdateForm.electricityReconnectionFee || 0,
          waterReconnectionFee: invoiceUpdateForm.waterReconnectionFee || 0,
          otherCharges: invoiceUpdateForm.otherCharges || 0,
          additionalChargesDescription: invoiceUpdateForm.additionalChargesDescription || '',
          totalDue: totalCharges,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice charges');
      }

      const result = await response.json();
      if (result.data) {
        setBreakdown(result.data);
        toast.success('Invoice charges updated successfully');
        setShowUpdateInvoiceModal(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update charges';
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

              {/* Additional Charges Section (visible when updating or editing) */}
              {breakdown && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Charges</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Late Payment Penalty (KES)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={paymentForm.penalty || ''}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, penalty: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="e.g., 500"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Other Charges (KES)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={paymentForm.additionalCharges || ''}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, additionalCharges: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="e.g., 200"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total with Water */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-lg">Total Rent Due</span>
                  <span className="text-3xl font-bold text-blue-600">KES {(calculateTotalWithWater() + (paymentForm.penalty || 0) + (paymentForm.additionalCharges || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Rent Due Date */}
              <div className="mb-4">
                <span className="text-gray-600 text-sm">Rent Due Date:</span>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(lease.rentDueDate).toLocaleDateString()}
                </p>
              </div>

              {/* Generate or Update Invoice Button */}
              <button
                onClick={breakdown ? handleOpenUpdateInvoiceModal : handleGenerateInvoice}
                disabled={generatingInvoice || submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                {generatingInvoice ? 'Generating Invoice...' : submitting ? 'Updating...' : breakdown ? 'Update Invoice' : 'Generate Invoice'}
              </button>
            </div>

            {/* Invoice & Payment Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Invoice & Payment</h2>
              
              {/* Breakdown Display */}
              {breakdown ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Invoice</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Rent</span>
                      <span className="font-semibold">KES {parseFloat(String(breakdown.baseRent ?? 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Water Charges</span>
                      <span className="font-semibold">KES {parseFloat(String(breakdown.waterCharges ?? 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Garbage Charges</span>
                      <span className="font-semibold">KES {parseFloat(String(breakdown.garbageCharges ?? 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Fee</span>
                      <span className="font-semibold">KES {parseFloat(String(breakdown.securityFee ?? 0)).toLocaleString()}</span>
                    </div>
                    {breakdown.penaltyCharges && parseFloat(String(breakdown.penaltyCharges)) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span className="text-gray-600">Late Payment Penalty</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.penaltyCharges)).toLocaleString()}</span>
                      </div>
                    )}
                    {breakdown.electricityReconnectionFee && parseFloat(String(breakdown.electricityReconnectionFee)) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span className="text-gray-600">Electricity Reconnection Fee</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.electricityReconnectionFee)).toLocaleString()}</span>
                      </div>
                    )}
                    {breakdown.waterReconnectionFee && parseFloat(String(breakdown.waterReconnectionFee)) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span className="text-gray-600">Water Reconnection Fee</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.waterReconnectionFee)).toLocaleString()}</span>
                      </div>
                    )}
                    {breakdown.otherCharges && parseFloat(String(breakdown.otherCharges)) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span className="text-gray-600">Other Charges</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.otherCharges)).toLocaleString()}</span>
                      </div>
                    )}
                    {breakdown.additionalChargesDescription && (
                      <div className="text-xs text-gray-700 bg-red-50 p-2 rounded italic">
                        Note: {breakdown.additionalChargesDescription}
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between bg-yellow-50 p-3 rounded">
                      <span className="text-gray-900 font-bold">Total Due</span>
                      <span className="text-2xl font-bold text-blue-600">KES {parseFloat(String(breakdown.totalDue ?? 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center">
                  <p className="text-gray-600 mb-2">No invoice generated yet</p>
                  <p className="text-sm text-gray-500">Generate an invoice to get started</p>
                </div>
              )}

              {/* Payment Status */}
              {breakdown && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-semibold text-green-600">KES {parseFloat(String(breakdown.amountPaid ?? 0)).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      {(() => {
                        const totalDue = parseFloat(String(breakdown.totalDue ?? 0));
                        const amountPaid = parseFloat(String(breakdown.amountPaid ?? 0));
                        const balanceRemaining = Math.max(0, totalDue - amountPaid);
                        const overpayment = Math.max(0, amountPaid - totalDue);
                        
                        if (overpayment > 0) {
                          return (
                            <>
                              <span className="text-gray-600">Overpayment</span>
                              <span className="font-semibold text-green-600">KES {overpayment.toLocaleString()}</span>
                            </>
                          );
                        } else if (balanceRemaining > 0) {
                          return (
                            <>
                              <span className="text-gray-600">Balance Remaining</span>
                              <span className="font-semibold text-red-600">KES {balanceRemaining.toLocaleString()}</span>
                            </>
                          );
                        }
                        return (
                          <>
                            <span className="text-gray-600">Status</span>
                            <span className="font-semibold text-green-600">Paid ✓</span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {(() => {
                        const totalDue = parseFloat(String(breakdown.totalDue ?? 0));
                        const amountPaid = parseFloat(String(breakdown.amountPaid ?? 0));
                        const balanceRemaining = Math.max(0, totalDue - amountPaid);
                        const overpayment = Math.max(0, amountPaid - totalDue);
                        
                        if (overpayment > 0) {
                          return `Status: Overpaid (KES ${overpayment.toLocaleString()})`;
                        } else if (balanceRemaining > 0) {
                          return `Status: Partial Payment (Balance: KES ${balanceRemaining.toLocaleString()})`;
                        }
                        return 'Status: Paid ✓';
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Make Payment Button */}
              {breakdown && (() => {
                const totalDue = parseFloat(String(breakdown.totalDue ?? 0));
                const amountPaid = parseFloat(String(breakdown.amountPaid ?? 0));
                const balanceRemaining = Math.max(0, totalDue - amountPaid);
                return balanceRemaining > 0;
              })() && (
                <button
                  onClick={handleOpenPaymentModal}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 mb-4"
                >
                  <CreditCard size={20} />
                  Make Payment
                </button>
              )}
              
              {breakdown && (() => {
                const totalDue = parseFloat(String(breakdown.totalDue ?? 0));
                const amountPaid = parseFloat(String(breakdown.amountPaid ?? 0));
                const balanceRemaining = Math.max(0, totalDue - amountPaid);
                return balanceRemaining === 0;
              })() && (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed mb-4"
                >
                  <CreditCard size={20} />
                  Payment Complete ✓
                </button>
              )}

              {/* Lease Info */}
              {breakdown && (
                <div className="border-t pt-4">
                  <p className="text-gray-600 text-sm">Lease Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(lease.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}
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
                {/* Current Invoice Summary */}
                {breakdown && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Invoice</h3>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rent</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.baseRent ?? 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Water Charges</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.waterCharges ?? 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Garbage Charges</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.garbageCharges ?? 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security Fee</span>
                        <span className="font-semibold">KES {parseFloat(String(breakdown.securityFee ?? 0)).toLocaleString()}</span>
                      </div>
                      {breakdown.penaltyCharges && parseFloat(String(breakdown.penaltyCharges)) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="text-gray-600">Late Payment Penalty</span>
                          <span className="font-semibold">KES {parseFloat(String(breakdown.penaltyCharges)).toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown.electricityReconnectionFee && parseFloat(String(breakdown.electricityReconnectionFee)) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="text-gray-600">Electricity Reconnection Fee</span>
                          <span className="font-semibold">KES {parseFloat(String(breakdown.electricityReconnectionFee)).toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown.waterReconnectionFee && parseFloat(String(breakdown.waterReconnectionFee)) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="text-gray-600">Water Reconnection Fee</span>
                          <span className="font-semibold">KES {parseFloat(String(breakdown.waterReconnectionFee)).toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown.otherCharges && parseFloat(String(breakdown.otherCharges)) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="text-gray-600">Other Charges</span>
                          <span className="font-semibold">KES {parseFloat(String(breakdown.otherCharges)).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold bg-yellow-100 p-2 rounded">
                        <span>Total Due</span>
                        <span className="text-blue-600">KES {parseFloat(String(breakdown.totalDue ?? 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                {breakdown && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Already Paid</span>
                        <span className="font-semibold text-green-600">KES {parseFloat(String(breakdown.amountPaid ?? 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 font-semibold">Balance Remaining</span>
                        <span className="font-semibold text-red-600">KES {Math.max(0, parseFloat(String(breakdown.totalDue ?? 0)) - parseFloat(String(breakdown.amountPaid ?? 0))).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

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
                    {breakdown && paymentForm.amount > 0 && (
                      <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                        {(() => {
                          const totalDue = parseFloat(String(breakdown.totalDue ?? 0));
                          const amountPaid = parseFloat(String(breakdown.amountPaid ?? 0));
                          const newTotalPaid = amountPaid + paymentForm.amount;
                          const newBalance = totalDue - newTotalPaid;
                          
                          if (newBalance > 0) {
                            return (
                              <div>
                                <p className="text-sm text-gray-600">Remaining Balance After Payment</p>
                                <p className="text-lg font-bold text-red-600">KES {newBalance.toLocaleString()}</p>
                              </div>
                            );
                          } else if (newBalance < 0) {
                            return (
                              <div>
                                <p className="text-sm text-gray-600">Overpayment</p>
                                <p className="text-lg font-bold text-green-600">KES {Math.abs(newBalance).toLocaleString()}</p>
                              </div>
                            );
                          } else {
                            return <p className="text-sm font-semibold text-green-600">Full Payment ✓</p>;
                          }
                        })()}
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

      {/* Update Invoice Modal */}
      {showUpdateInvoiceModal && breakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Update Invoice Charges</h2>
              <button
                onClick={() => setShowUpdateInvoiceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Current Breakdown Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Charges</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Rent</span>
                  <span className="font-semibold">KES {parseFloat(String(breakdown.baseRent || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water Charges</span>
                  <span className="font-semibold">KES {parseFloat(String(breakdown.waterCharges || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Garbage Charges</span>
                  <span className="font-semibold">KES {parseFloat(String(breakdown.garbageCharges || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Fee</span>
                  <span className="font-semibold">KES {parseFloat(String(breakdown.securityFee || 0)).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>KES {(parseFloat(String(breakdown.baseRent || 0)) + parseFloat(String(breakdown.waterCharges || 0)) + parseFloat(String(breakdown.garbageCharges || 0)) + parseFloat(String(breakdown.securityFee || 0))).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Additional Charges Form */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Additional Charges</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Late Payment Penalty (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={invoiceUpdateForm.penaltyCharges || ''}
                  onChange={(e) =>
                    setInvoiceUpdateForm({ ...invoiceUpdateForm, penaltyCharges: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Electricity Reconnection Fee (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={invoiceUpdateForm.electricityReconnectionFee || ''}
                  onChange={(e) =>
                    setInvoiceUpdateForm({ ...invoiceUpdateForm, electricityReconnectionFee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Water Reconnection Fee (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={invoiceUpdateForm.waterReconnectionFee || ''}
                  onChange={(e) =>
                    setInvoiceUpdateForm({ ...invoiceUpdateForm, waterReconnectionFee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Charges (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={invoiceUpdateForm.otherCharges || ''}
                  onChange={(e) =>
                    setInvoiceUpdateForm({ ...invoiceUpdateForm, otherCharges: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description of Other Charges</label>
                <textarea
                  value={invoiceUpdateForm.additionalChargesDescription || ''}
                  onChange={(e) =>
                    setInvoiceUpdateForm({ ...invoiceUpdateForm, additionalChargesDescription: e.target.value })
                  }
                  placeholder="e.g., Maintenance fee, HOA charges, etc."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* New Total */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-bold text-lg">New Total Due</span>
                <span className="text-3xl font-bold text-yellow-600">
                  KES {(parseFloat(String(breakdown.baseRent || 0)) + parseFloat(String(breakdown.waterCharges || 0)) + parseFloat(String(breakdown.garbageCharges || 0)) + parseFloat(String(breakdown.securityFee || 0)) + (invoiceUpdateForm.penaltyCharges || 0) + (invoiceUpdateForm.electricityReconnectionFee || 0) + (invoiceUpdateForm.waterReconnectionFee || 0) + (invoiceUpdateForm.otherCharges || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateInvoiceModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInvoiceCharges}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold"
              >
                {submitting ? 'Updating...' : 'Update Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  maritalStatus: string;
  numberOfChildren: number;
  occupation: string;
  postalAddress: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  
  // Lease Details
  monthlyRent: number;
  securityFee: number;
  garbageAmount: number;
  waterUnitCost: number;
  dateJoined: string;
  leaseTermMonths: number;
  rentDueDate: string;
  notes: string;
  
  // Deposit Breakdown
  rentDeposit: number;
  waterDeposit: number;
  electricityDeposit: number;
  otherDeposit: number;
  otherDepositDescription: string;
}

export default function AddTenantPage() {
  const router = useRouter();
  const params = useParams();
  const { id: propertyId, unitId } = params as { id: string; unitId: string };

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unitInfo, setUnitInfo] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [autoRent, setAutoRent] = useState(false);
  const [rentFetchError, setRentFetchError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    phoneNumber: '',
    nationality: '',
    maritalStatus: '',
    numberOfChildren: 0,
    occupation: '',
    postalAddress: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    monthlyRent: 0,
    securityFee: 0,
    garbageAmount: 0,
    waterUnitCost: 0,
    dateJoined: new Date().toISOString().split('T')[0],
    leaseTermMonths: 12,
    rentDueDate: '',
    notes: '',
    rentDeposit: 0,
    waterDeposit: 0,
    electricityDeposit: 0,
    otherDeposit: 0,
    otherDepositDescription: '',
  });

  // Fetch unit info and property pricing on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const apiResponse = await response.json();
          const data = apiResponse.data;
          
          console.log('📦 Property Data Received:', {
            propertyId,
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            roomTypePricings: data?.roomTypePricings,
          });
          
          setProperty(data);
          
          // Find the specific unit from floors
          let foundUnit: any = null;
          if (data.floors && Array.isArray(data.floors)) {
            for (const floor of data.floors) {
              const unit = floor.units?.find((u: any) => u.id === unitId);
              if (unit) {
                foundUnit = unit;
                break;
              }
            }
          }
          
          if (foundUnit) {
            console.log('🏠 Unit Found:', {
              unitId,
              unitNumber: foundUnit.unitNumber,
              roomType: foundUnit.roomType,
              status: foundUnit.status,
            });
            
            setUnitInfo(foundUnit);
            
            // Auto-populate monthly rent from room type pricing
            if (foundUnit.roomType && data.roomTypePricings) {
              console.log('🔍 Looking for pricing:', {
                roomType: foundUnit.roomType,
                availablePricings: data.roomTypePricings.map((p: any) => ({
                  roomType: p.roomType,
                  price: p.price,
                })),
              });
              
              const pricing = data.roomTypePricings.find(
                (p: any) => p.roomType === foundUnit.roomType
              );
              
              if (pricing && pricing.price > 0) {
                console.log('✅ Pricing Found - Auto-populating rent:', {
                  roomType: pricing.roomType,
                  price: pricing.price,
                  garbageAmount: pricing.garbageAmount,
                  waterUnitCost: pricing.waterUnitCost,
                });
                
                setFormData(prev => ({
                  ...prev,
                  monthlyRent: pricing.price,
                  garbageAmount: pricing.garbageAmount || prev.garbageAmount,
                  waterUnitCost: pricing.waterUnitCost || prev.waterUnitCost,
                }));
                setAutoRent(true);
              } else {
                console.warn('⚠️ No pricing found for room type:', foundUnit.roomType);
                setRentFetchError(`No pricing found for room type: ${foundUnit.roomType}`);
              }
            } else {
              console.warn('⚠️ Missing roomType or roomTypePricings:', {
                hasRoomType: !!foundUnit.roomType,
                hasPricings: !!data.roomTypePricings,
              });
            }
          } else {
            console.error('❌ Unit not found:', unitId);
            setRentFetchError('Unit not found');
          }
        } else {
          const error = await response.json();
          console.error('❌ Failed to fetch property:', response.status, error);
          setRentFetchError('Failed to fetch property details');
        }
      } catch (error) {
        console.error('❌ Error fetching unit info:', error);
        setRentFetchError('Error loading unit information');
      } finally {
        setPageLoading(false);
      }
    };

    if (propertyId && unitId) {
      fetchData();
    }
  }, [propertyId, unitId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['monthlyRent', 'securityFee', 'garbageAmount', 'waterUnitCost', 'leaseTermMonths', 'numberOfChildren', 'rentDeposit', 'waterDeposit', 'electricityDeposit', 'otherDeposit'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (parseFloat(value) || 0) : value,
    }));
  };

  const calculateTotalDeposit = () => {
    return (formData.rentDeposit || 0) + (formData.waterDeposit || 0) + (formData.electricityDeposit || 0) + (formData.otherDeposit || 0);
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.idNumber.trim()) {
      toast.error('ID Number is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (!formData.nationality.trim()) {
      toast.error('Nationality is required');
      return false;
    }
    if (formData.monthlyRent <= 0) {
      toast.error('Monthly rent must be greater than 0');
      return false;
    }
    if (formData.leaseTermMonths <= 0) {
      toast.error('Lease term must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}/units/${unitId}/create-tenant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to create tenant');
        return;
      }

      toast.success('Tenant created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/properties/${propertyId}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('An error occurred while creating the tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Tenant</h1>
          <p className="text-gray-600 mt-2">
            {pageLoading ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                Loading unit information...
              </span>
            ) : unitInfo ? (
              `Unit ${unitInfo.unitNumber} • ${unitInfo.roomType}`
            ) : (
              'Add comprehensive tenant details and lease information'
            )}
          </p>
        </div>

        {/* Error Alert */}
        {!pageLoading && rentFetchError && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ {rentFetchError} - Please enter the monthly rent manually below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ========== PERSONAL INFORMATION SECTION ========== */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g., John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g., Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="e.g., 12345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., +254701234567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="e.g., Kenyan"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Number of Children */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children</label>
                <input
                  type="number"
                  name="numberOfChildren"
                  value={formData.numberOfChildren || ''}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g., Engineer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Postal Address */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Address</label>
                <textarea
                  name="postalAddress"
                  value={formData.postalAddress}
                  onChange={handleChange}
                  placeholder="Enter full postal address"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ========== NEXT OF KIN SECTION ========== */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Next of Kin</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Next of Kin Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next of Kin Name</label>
                <input
                  type="text"
                  name="nextOfKinName"
                  value={formData.nextOfKinName}
                  onChange={handleChange}
                  placeholder="e.g., Jane Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Next of Kin Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next of Kin Phone</label>
                <input
                  type="tel"
                  name="nextOfKinPhone"
                  value={formData.nextOfKinPhone}
                  onChange={handleChange}
                  placeholder="e.g., +254701234567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Next of Kin Relationship */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  name="nextOfKinRelationship"
                  value={formData.nextOfKinRelationship}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========== LEASE DETAILS SECTION ========== */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lease Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Monthly Rent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (KES) * {autoRent && <span className="text-xs text-green-600 font-semibold">(Auto-populated)</span>}
                </label>
                {pageLoading ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-gray-600 text-sm">Loading unit pricing...</span>
                  </div>
                ) : rentFetchError ? (
                  <div>
                    <input
                      type="number"
                      name="monthlyRent"
                      value={formData.monthlyRent || ''}
                      onChange={handleChange}
                      placeholder="e.g., 25000"
                      min="0"
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-orange-600 mt-1">{rentFetchError} - Please enter manually</p>
                  </div>
                ) : (
                  <input
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent || ''}
                    onChange={handleChange}
                    placeholder="e.g., 25000"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                {autoRent && formData.monthlyRent > 0 && (
                  <p className="text-xs text-green-600 mt-1">✓ Rent auto-populated from unit's {unitInfo?.roomType} pricing</p>
                )}
              </div>

              {/* Security Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Security Fee (KES)</label>
                <input
                  type="number"
                  name="securityFee"
                  value={formData.securityFee || ''}
                  onChange={handleChange}
                  placeholder="e.g., 25000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Garbage Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garbage Amount (KES)</label>
                <input
                  type="number"
                  name="garbageAmount"
                  value={formData.garbageAmount || ''}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Water Unit Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Water Unit Cost (KES)</label>
                <input
                  type="number"
                  name="waterUnitCost"
                  value={formData.waterUnitCost || ''}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Joined */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Joined</label>
                <input
                  type="date"
                  name="dateJoined"
                  value={formData.dateJoined}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lease Term Months */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lease Term (Months) *</label>
                <input
                  type="number"
                  name="leaseTermMonths"
                  value={formData.leaseTermMonths || ''}
                  onChange={handleChange}
                  placeholder="e.g., 12"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Rent Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rent Due Date</label>
                <input
                  type="date"
                  name="rentDueDate"
                  value={formData.rentDueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about the lease..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ========== DEPOSIT BREAKDOWN SECTION ========== */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Deposit Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Rent Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rent Deposit (KES)</label>
                <input
                  type="number"
                  name="rentDeposit"
                  value={formData.rentDeposit || ''}
                  onChange={handleChange}
                  placeholder="e.g., 25000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Water Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Water Deposit (KES)</label>
                <input
                  type="number"
                  name="waterDeposit"
                  value={formData.waterDeposit || ''}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Electricity Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Electricity Deposit (KES)</label>
                <input
                  type="number"
                  name="electricityDeposit"
                  value={formData.electricityDeposit || ''}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Other Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Deposit (KES)</label>
                <input
                  type="number"
                  name="otherDeposit"
                  value={formData.otherDeposit || ''}
                  onChange={handleChange}
                  placeholder="e.g., 2000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Other Deposit Description */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Deposit Description</label>
                <input
                  type="text"
                  name="otherDepositDescription"
                  value={formData.otherDepositDescription}
                  onChange={handleChange}
                  placeholder="e.g., Key Replacement, Cleaning, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Total Deposit Summary Card */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Rent Deposit</p>
                  <p className="text-lg font-bold text-gray-900">{formData.rentDeposit?.toLocaleString() || '0'} KES</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Water Deposit</p>
                  <p className="text-lg font-bold text-gray-900">{formData.waterDeposit?.toLocaleString() || '0'} KES</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Electricity</p>
                  <p className="text-lg font-bold text-gray-900">{formData.electricityDeposit?.toLocaleString() || '0'} KES</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Other</p>
                  <p className="text-lg font-bold text-gray-900">{formData.otherDeposit?.toLocaleString() || '0'} KES</p>
                </div>
                <div className="border-l-2 border-blue-300 pl-4">
                  <p className="text-xs text-gray-600 font-semibold">TOTAL DEPOSIT</p>
                  <p className="text-2xl font-bold text-blue-600">{calculateTotalDeposit().toLocaleString()} KES</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========== FORM ACTIONS ========== */}
          <div className="flex justify-between items-center gap-4">
            <Link href={`/dashboard/properties/${propertyId}`}>
              <button
                type="button"
                className="px-8 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={submitting || pageLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Tenant...
                </>
              ) : (
                'Create Tenant'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  monthlyRent: number;
  depositPaid: number;
  dateJoined: string;
  leaseTermMonths: number;
  notes: string;
}

export default function AddTenantPage() {
  const router = useRouter();
  const params = useParams();
  const { id: propertyId, unitId } = params as { id: string; unitId: string };

  const [loading, setLoading] = useState(false);
  const [unitInfo, setUnitInfo] = useState<any>(null);

  React.useEffect(() => {
    console.log('Page params:', { params, propertyId, unitId });
  }, [params, propertyId, unitId]);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    monthlyRent: 0,
    depositPaid: 0,
    dateJoined: new Date().toISOString().split('T')[0],
    leaseTermMonths: 12,
    notes: '',
  });

  // Fetch unit info on mount
  React.useEffect(() => {
    const fetchUnitInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}/units/${unitId}/current-tenant`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUnitInfo(data);
        }
      } catch (error) {
        console.error('Error fetching unit info:', error);
      }
    };

    if (propertyId && unitId) {
      fetchUnitInfo();
    }
  }, [propertyId, unitId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: 
        name === 'monthlyRent' || name === 'depositPaid' || name === 'leaseTermMonths'
          ? parseFloat(value) || 0
          : value,
    }));
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
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid email is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Phone number is required');
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

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      console.log('Submitting tenant form data:', formData);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}/units/${unitId}/create-tenant`);
      
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
        console.error('Backend error response:', error);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Tenant</h1>
          <p className="text-gray-600 mt-2">Add tenant details and lease information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tenant Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tenant Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g., John"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g., Kariuki"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., +254 722 123 456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 The tenant account will be created with password: <code className="bg-blue-100 px-2 py-1 rounded">tenant@123</code>
              </p>
            </div>
          </div>

          {/* Lease Details Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Lease Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent (KES) *
                </label>
                <input
                  type="number"
                  name="monthlyRent"
                  value={formData.monthlyRent || ''}
                  onChange={handleChange}
                  placeholder="e.g., 25000"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Paid (KES)
                </label>
                <input
                  type="number"
                  name="depositPaid"
                  value={formData.depositPaid || ''}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Joined *
                </label>
                <input
                  type="date"
                  name="dateJoined"
                  value={formData.dateJoined}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Term (Months) *
                </label>
                <input
                  type="number"
                  name="leaseTermMonths"
                  value={formData.leaseTermMonths || ''}
                  onChange={handleChange}
                  placeholder="e.g., 12"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about the tenant or lease..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center">
            <Link href={`/dashboard/properties/${propertyId}`}>
              <Button className="bg-gray-300 hover:bg-gray-400 text-gray-900">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

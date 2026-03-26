'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface TenantDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  idNumber: string;
  nationality?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  occupation?: string;
  postalAddress?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  tenantProfile?: {
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
  };
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
      setTenant(result.data || result);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      toast.error('Failed to load tenant details');
      router.push('/dashboard/tenants');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <Link href="/dashboard/tenants">
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={20} />
            Back to Tenants
          </button>
        </Link>

        {/* Tenant Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
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
                <p className="text-lg text-gray-900">{tenant.nationality || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marital Status</p>
                <p className="text-lg text-gray-900 capitalize">{tenant.maritalStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Children</p>
                <p className="text-lg text-gray-900">{tenant.numberOfChildren || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupation</p>
                <p className="text-lg text-gray-900">{tenant.occupation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Postal Address</p>
                <p className="text-lg text-gray-900">{tenant.postalAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Next of Kin Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Next of Kin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg text-gray-900">{tenant.nextOfKinName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Relationship</p>
                <p className="text-lg text-gray-900">{tenant.nextOfKinRelationship || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg text-gray-900">{tenant.nextOfKinPhone || 'N/A'}</p>
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
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Unit {
  id: string;
  unitNumber: number;
  roomType: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  currentTenantId?: string;
}

interface Floor {
  id: string;
  floorNumber: number;
  unitsPerFloor: number;
  units: Unit[];
}

interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  description: string;
  monthlyRent: number;
  depositAmount: number;
  propertyType: string;
  landlord: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  floors: Floor[];
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  vacant: 'bg-green-100 text-green-800',
  occupied: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Property not found');
          router.push('/dashboard/properties');
        } else {
          throw new Error('Failed to fetch property details');
        }
        return;
      }

      const result = await response.json();
      setProperty(result.data);
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };



  const handleRemoveTenant = async (unitId: string) => {
    if (!confirm('Are you sure you want to remove the tenant from this unit?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/properties/${propertyId}/units/${unitId}/remove-tenant`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove tenant');

      toast.success('Tenant removed successfully');
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove tenant';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Property not found</p>
        </div>
      </div>
    );
  }

  const totalUnits = property.floors.reduce((sum, floor) => sum + floor.units.length, 0);
  const occupiedUnits = property.floors.reduce(
    (sum, floor) => sum + floor.units.filter((u) => u.status === 'occupied').length,
    0
  );
  const vacantUnits = property.floors.reduce(
    (sum, floor) => sum + floor.units.filter((u) => u.status === 'vacant').length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Properties
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
        <p className="text-gray-600 mt-2">
          {property.address}, {property.city}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Floors</p>
          <p className="text-3xl font-bold text-gray-900">{property.floors.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Units</p>
          <p className="text-3xl font-bold text-gray-900">{totalUnits}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Occupied</p>
          <p className="text-3xl font-bold text-blue-600">{occupiedUnits}</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(0) : 0}% occupancy
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Vacant</p>
          <p className="text-3xl font-bold text-green-600">{vacantUnits}</p>
        </div>
      </div>

      {/* Property Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Property Details Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Property Type</p>
                <p className="font-medium text-gray-900 capitalize">{property.propertyType}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Monthly Rent</p>
                <p className="font-medium text-gray-900">KES {property.monthlyRent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Deposit Amount</p>
                <p className="font-medium text-gray-900">KES {property.depositAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Country</p>
                <p className="font-medium text-gray-900">{property.country}</p>
              </div>
            </div>
            {property.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-2">Description</p>
                <p className="text-gray-700">{property.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Landlord Information Sidebar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Landlord Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Name</p>
              <p className="font-medium text-gray-900">
                {property.landlord.firstName} {property.landlord.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p className="font-medium text-gray-900 break-all">{property.landlord.email}</p>
            </div>
            <div className="pt-4 flex gap-2">
              <Link href={`/dashboard/properties/${property.id}/edit`} className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
                  Edit Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floors and Units */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Floors & Units</h2>

        {property.floors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No floors configured for this property</p>
          </div>
        ) : (
          property.floors.map((floor) => (
            <div key={floor.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Floor {floor.floorNumber}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {floor.units.map((unit) => (
                  <div
                    key={unit.id}
                    className={`border rounded-lg p-4 ${
                      statusColors[unit.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Unit {unit.unitNumber}</p>
                        <p className="text-sm opacity-75">{unit.roomType}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-opacity-30 bg-black">
                        {unit.status}
                      </span>
                    </div>
                    {unit.currentTenantId && (
                      <p className="text-xs opacity-75 mt-3">
                        Tenant ID: {unit.currentTenantId.substring(0, 8)}...
                      </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {unit.status === 'vacant' ? (
                        <Link href={`/dashboard/properties/${propertyId}/units/${unit.id}/add-tenant`} className="flex-1">
                          <button className="w-full text-xs font-semibold px-3 py-1 rounded bg-opacity-20 bg-black hover:bg-opacity-30 flex items-center justify-center gap-1">
                            <Plus size={14} />
                            Add Tenant
                          </button>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleRemoveTenant(unit.id)}
                          className="flex-1 text-xs font-semibold px-3 py-1 rounded bg-opacity-20 bg-black hover:bg-opacity-30 flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {floor.units.length === 0 && (
                <p className="text-gray-600 text-center py-4">No units on this floor</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href="/dashboard/properties">
          <Button className="bg-gray-300 hover:bg-gray-400 text-gray-900">Back to Properties</Button>
        </Link>
        <Link href={`/dashboard/properties/${property.id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Edit Property</Button>
        </Link>
      </div>


    </div>
  );
}

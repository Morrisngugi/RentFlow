'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  monthlyRent: number;
  floorsCount: number;
  totalUnits: number;
  landlord: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [filterLandlordName, setFilterLandlordName] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const landlordId = searchParams.get('landlordId');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    // Filter properties if landlordId is provided
    if (landlordId) {
      const filtered = properties.filter((p) => p.landlord.id === landlordId);
      setFilteredProperties(filtered);
      
      // Get landlord name from first filtered property
      if (filtered.length > 0) {
        setFilterLandlordName(filtered[0].landlord.name);
      }
    } else {
      setFilteredProperties(properties);
      setFilterLandlordName(null);
    }
  }, [properties, landlordId]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const result = await response.json();
      setProperties(result.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      toast.success('Property deleted successfully');
      setProperties(properties.filter((p) => p.id !== propertyId));
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const clearFilter = () => {
    router.push('/dashboard/properties');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {filterLandlordName ? `${filterLandlordName}'s Properties` : 'My Properties'}
          </h1>
          <p className="text-gray-600 mt-2">
            {filterLandlordName
              ? `Showing ${filteredProperties.length} propert${filteredProperties.length === 1 ? 'y' : 'ies'} owned by ${filterLandlordName}`
              : 'Manage all your properties in one place'}
          </p>
        </div>
        <Link href="/dashboard/properties/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            + New Property
          </Button>
        </Link>
      </div>

      {/* Filter Badge */}
      {landlordId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              📊 Filtered by landlord: <strong>{filterLandlordName}</strong>
            </span>
          </div>
          <button
            onClick={clearFilter}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            <X size={16} />
            Clear Filter
          </button>
        </div>
      )}

      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {landlordId ? 'No Properties Found' : 'No Properties Yet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {landlordId
              ? `This landlord hasn't created any properties yet.`
              : 'Start by creating your first property to manage tenants and track rent payments.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/properties/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                Create Property
              </Button>
            </Link>
            {landlordId && (
              <button
                onClick={clearFilter}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
              >
                View All Properties
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Properties List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => setSelectedProperty(property.id)}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
                  selectedProperty === property.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {property.address}, {property.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">KES {property.monthlyRent ? property.monthlyRent.toLocaleString() : 'N/A'}</p>
                    <p className="text-xs text-gray-500">Monthly Rent</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-gray-200 my-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{property.floorsCount}</p>
                    <p className="text-xs text-gray-600">Floors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{property.totalUnits}</p>
                    <p className="text-xs text-gray-600">Units</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{property.landlord.name}</p>
                    <p className="text-xs text-gray-600">Landlord</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Created {new Date(property.createdAt).toLocaleDateString()}
                  </p>
                  <Link href={`/dashboard/properties/${property.id}`}>
                    <Button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-1 text-sm rounded">
                      View Details →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Property Details Sidebar */}
          {selectedProperty && (
            <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-6">
              {(() => {
                const property = filteredProperties.find((p) => p.id === selectedProperty);
                if (!property) return null;

                return (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">{property.name}</h2>
                      <p className="text-gray-600 text-sm">{property.address}</p>
                      <p className="text-gray-600 text-sm">{property.city}</p>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Landlord Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">{property.landlord.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium text-gray-900 break-all">{property.landlord.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Property Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Floors:</span>
                          <span className="font-medium">{property.floorsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Units:</span>
                          <span className="font-medium">{property.totalUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Rent:</span>
                          <span className="font-medium">KES {property.monthlyRent ? property.monthlyRent.toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/properties/${property.id}`} className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
                          Edit Property
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

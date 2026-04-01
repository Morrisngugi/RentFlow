'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_URL } from '@/lib/api';

interface Unit {
  id: string;
  unitNumber: number;
  unitName?: string;
  roomType: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  currentTenantId?: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Floor {
  id: string;
  floorNumber: number;
  floorName?: string;
  unitsPerFloor: number;
  units: Unit[];
}

interface RoomTypePricing {
  id: string;
  roomType: string;
  price: number;
  billingFrequency: string;
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
  } | null;
  floors: Floor[];
  roomTypePricings: RoomTypePricing[];
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
  const [showRentModal, setShowRentModal] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showEditFloor, setShowEditFloor] = useState<string | null>(null);
  const [showEditUnit, setShowEditUnit] = useState<string | null>(null);
  const [showAddUnit, setShowAddUnit] = useState<string | null>(null);

  // Form states
  const [rentForm, setRentForm] = useState({ monthlyRent: 0, depositAmount: 0 });
  const [roomTypePrices, setRoomTypePrices] = useState<Record<string, number>>({});
  const [floorForm, setFloorForm] = useState({ floorNumber: 0, unitsPerFloor: 0, floorName: '' });
  const [unitForm, setUnitForm] = useState({ unitNumber: 0, unitName: '', roomType: '', status: 'vacant' as 'vacant' | 'occupied' | 'maintenance' });
  const [submitting, setSubmitting] = useState(false);

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
      setRentForm({
        monthlyRent: result.data.monthlyRent || 0,
        depositAmount: result.data.depositAmount || 0,
      });
      
      // Initialize room type prices
      if (result.data.roomTypePricings && result.data.roomTypePricings.length > 0) {
        const prices: Record<string, number> = {};
        result.data.roomTypePricings.forEach((pricing: any) => {
          prices[pricing.roomType] = pricing.price;
        });
        setRoomTypePrices(prices);
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  // Rent Details Handlers
  const handleUpdateRoomTypePrices = async () => {
    setSubmitting(true);
    try {
      const updates = Object.entries(roomTypePrices).map(([roomType, price]) =>
        fetch(`${API_URL}/properties/${propertyId}/room-type-pricing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            roomType,
            price,
            billingFrequency: 'monthly',
          }),
        })
      );

      const results = await Promise.all(updates);
      
      // Check if all requests were successful
      for (const res of results) {
        if (!res.ok) throw new Error('Failed to update pricing');
      }

      toast.success('Room type prices updated successfully');
      setShowRentModal(false);
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update pricing';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Floor Handlers
  const handleAddFloor = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/floors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(floorForm),
      });

      if (!response.ok) throw new Error('Failed to add floor');

      toast.success('Floor added successfully');
      setShowAddFloor(false);
      setFloorForm({ floorNumber: 0, unitsPerFloor: 0, floorName: '' });
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add floor';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFloor = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/floors/${showEditFloor}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(floorForm),
      });

      if (!response.ok) throw new Error('Failed to update floor');

      toast.success('Floor updated successfully');
      setShowEditFloor(null);
      setFloorForm({ floorNumber: 0, unitsPerFloor: 0, floorName: '' });
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update floor';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm('Are you sure you want to delete this floor? All units on this floor will be deleted.')) return;

    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/floors/${floorId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete floor');

      toast.success('Floor deleted successfully');
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete floor';
      toast.error(message);
    }
  };

  // Unit Handlers
  const handleAddUnit = async () => {
    if (!showAddUnit) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...unitForm,
          floorId: showAddUnit,
        }),
      });

      if (!response.ok) throw new Error('Failed to add unit');

      toast.success('Unit added successfully');
      setShowAddUnit(null);
      setUnitForm({ unitNumber: 0, unitName: '', roomType: '', status: 'vacant' });
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add unit';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUnit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/units/${showEditUnit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(unitForm),
      });

      if (!response.ok) throw new Error('Failed to update unit');

      toast.success('Unit updated successfully');
      setShowEditUnit(null);
      setUnitForm({ unitNumber: 0, unitName: '', roomType: '', status: 'vacant' });
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update unit';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/units/${unitId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete unit');

      toast.success('Unit deleted successfully');
      fetchPropertyDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete unit';
      toast.error(message);
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
              <button
                onClick={() => setShowRentModal(true)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Edit2 size={18} />
                Edit Rent
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Property Type</p>
                <p className="font-medium text-gray-900 capitalize">{property.propertyType}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Country</p>
                <p className="font-medium text-gray-900">{property.country}</p>
              </div>
            </div>

            {/* Room Type Pricing Section */}
            {property.roomTypePricings && property.roomTypePricings.length > 0 ? (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Pricing by Room Type</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 text-gray-700 font-semibold text-sm">Room Type</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-semibold text-sm">Monthly Price</th>
                        <th className="text-left px-4 py-3 text-gray-700 font-semibold text-sm">Billing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.roomTypePricings.map((pricing, idx) => (
                        <tr key={pricing.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-gray-900 font-medium">{pricing.roomType}</td>
                          <td className="px-4 py-3 text-gray-900 font-semibold text-lg">KES {pricing.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-600 capitalize">{pricing.billingFrequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-sm">No room type pricing has been set yet.</p>
              </div>
            )}

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
          {property?.landlord ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Name</p>
                <p className="font-medium text-gray-900">
                  {property.landlord?.firstName || 'N/A'} {property.landlord?.lastName || ''}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-medium text-gray-900 break-all">{property.landlord?.email || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">
              <p>No landlord information available</p>
            </div>
          )}
          <div className="pt-4 flex gap-2">
            <Link href={`/dashboard/properties/${property.id}/edit`} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
                Edit Property
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floors and Units */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Floors & Units</h2>
          <button
            onClick={() => setShowAddFloor(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} />
            Add Floor
          </button>
        </div>

        {!property?.floors || property.floors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No floors configured for this property</p>
          </div>
        ) : (
          property.floors.map((floor) => (
            <div key={floor.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{floor.floorName || `Floor ${floor.floorNumber}`}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFloorForm({ floorNumber: floor.floorNumber, unitsPerFloor: floor.unitsPerFloor, floorName: floor.floorName || '' });
                      setShowEditFloor(floor.id);
                    }}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFloor(floor.id)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>

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
                        <p className="font-semibold">{unit.unitName || `Unit ${unit.unitNumber}`}</p>
                        <p className="text-sm opacity-75">{unit.roomType}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setUnitForm({ unitNumber: unit.unitNumber, unitName: unit.unitName || '', roomType: unit.roomType, status: unit.status });
                            setShowEditUnit(unit.id);
                          }}
                          className="text-xs bg-opacity-20 bg-black hover:bg-opacity-30 p-1 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-opacity-30 bg-black">
                          {unit.status}
                        </span>
                      </div>
                    </div>
                    {unit.currentTenantId && (
                      <p className="text-xs opacity-75 mt-3">
                        {unit.tenant ? (
                          <Link href={`/dashboard/tenants/${unit.tenant.id}`} className="text-blue-600 hover:underline font-semibold">
                            {unit.tenant.firstName} {unit.tenant.lastName}
                          </Link>
                        ) : (
                          `Tenant ID: ${unit.currentTenantId.substring(0, 8)}...`
                        )}
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
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="text-xs font-semibold px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Unit Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-32">
                  <button
                    onClick={() => {
                      setUnitForm({ unitNumber: 0, unitName: '', roomType: '', status: 'vacant' });
                      setShowAddUnit(floor.id);
                    }}
                    className="text-center text-gray-600 hover:text-gray-900 flex flex-col items-center gap-2"
                  >
                    <Plus size={24} />
                    <span className="font-semibold">Add Unit</span>
                  </button>
                </div>
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

      {/* ===== MODALS ===== */}
      
      {/* Edit Rent Details Modal */}
      {showRentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Room Type Pricing</h3>
              <button
                onClick={() => setShowRentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {property && property.roomTypePricings && property.roomTypePricings.length > 0 ? (
              <div>
                <div className="space-y-4">
                  {property.roomTypePricings.map((pricing) => (
                    <div key={pricing.id} className="flex items-center gap-4">
                      <label className="w-40 text-sm font-medium text-gray-700">
                        {pricing.roomType}
                      </label>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-gray-600">KES</span>
                        <input
                          type="number"
                          value={roomTypePrices[pricing.roomType] || pricing.price}
                          onChange={(e) =>
                            setRoomTypePrices({
                              ...roomTypePrices,
                              [pricing.roomType]: parseFloat(e.target.value),
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowRentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRoomTypePrices}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Prices'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No room type pricing available</p>
                <button
                  onClick={() => setShowRentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showAddFloor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Floor</h3>
              <button
                onClick={() => setShowAddFloor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                <input
                  type="number"
                  value={floorForm.floorNumber}
                  onChange={(e) => setFloorForm({ ...floorForm, floorNumber: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Ground Floor, First Floor"
                  value={floorForm.floorName}
                  onChange={(e) => setFloorForm({ ...floorForm, floorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units Per Floor</label>
                <input
                  type="number"
                  value={floorForm.unitsPerFloor}
                  onChange={(e) => setFloorForm({ ...floorForm, unitsPerFloor: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddFloor(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFloor}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Floor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Floor Modal */}
      {showEditFloor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Floor</h3>
              <button
                onClick={() => setShowEditFloor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                <input
                  type="number"
                  value={floorForm.floorNumber}
                  onChange={(e) => setFloorForm({ ...floorForm, floorNumber: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Ground Floor, First Floor"
                  value={floorForm.floorName}
                  onChange={(e) => setFloorForm({ ...floorForm, floorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units Per Floor</label>
                <input
                  type="number"
                  value={floorForm.unitsPerFloor}
                  onChange={(e) => setFloorForm({ ...floorForm, unitsPerFloor: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditFloor(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFloor}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Unit</h3>
              <button
                onClick={() => setShowAddUnit(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                <input
                  type="number"
                  value={unitForm.unitNumber}
                  onChange={(e) => setUnitForm({ ...unitForm, unitNumber: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., A001, B101"
                  value={unitForm.unitName}
                  onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <input
                  type="text"
                  placeholder="e.g., 1BR, 2BR, Studio"
                  value={unitForm.roomType}
                  onChange={(e) => setUnitForm({ ...unitForm, roomType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={unitForm.status}
                  onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddUnit(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUnit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {showEditUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Unit</h3>
              <button
                onClick={() => setShowEditUnit(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                <input
                  type="number"
                  value={unitForm.unitNumber}
                  onChange={(e) => setUnitForm({ ...unitForm, unitNumber: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., A001, B101"
                  value={unitForm.unitName}
                  onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <input
                  type="text"
                  placeholder="e.g., 1BR, 2BR, Studio"
                  value={unitForm.roomType}
                  onChange={(e) => setUnitForm({ ...unitForm, roomType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={unitForm.status}
                  onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditUnit(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUnit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

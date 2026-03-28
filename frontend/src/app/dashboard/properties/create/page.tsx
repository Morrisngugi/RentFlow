'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Utility to generate floor names
function generateFloorName(floorNumber: number): string {
  if (floorNumber === 1) {
    return 'Ground Floor';
  } else if (floorNumber === 2) {
    return 'First Floor';
  } else {
    const ordinal = getOrdinalSuffix(floorNumber - 1);
    return `${floorNumber - 1}${ordinal} Floor`;
  }
}

function getOrdinalSuffix(num: number): string {
  if (num % 100 >= 11 && num % 100 <= 13) {
    return 'th';
  }
  switch (num % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

interface Floor {
  floorNumber: number;
  unitsPerFloor: number;
  roomTypes: string[];
  unitNames: string[];
  description?: string;
}

interface FormData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  description: string;
  propertyType: string;
  floors: Floor[];
  landlordFirstName: string;
  landlordLastName: string;
  landlordEmail: string;
  landlordPhone: string;
  landlordIdNumber: string;
  landlordPassword: string;
  confirmPassword: string;
  roomTypePrices: { [roomType: string]: number };
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Kenya',
    description: '',
    propertyType: 'house',
    floors: [
      {
        floorNumber: 1,
        unitsPerFloor: 2,
        roomTypes: ['1-Bedroom', '1-Bedroom'],
        unitNames: ['Unit 1', 'Unit 2'],
        description: 'Ground Floor',
      },
    ],
    landlordFirstName: '',
    landlordLastName: '',
    landlordEmail: '',
    landlordPhone: '',
    landlordIdNumber: '',
    landlordPassword: '',
    confirmPassword: '',
    roomTypePrices: {},
  });

  const [showLandlordPassword, setShowLandlordPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePropertyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLandlordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateFloor = (index: number, updates: Partial<Floor>) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      newFloors[index] = { ...newFloors[index], ...updates };
      return { ...prev, floors: newFloors };
    });
  };

  const updateFloorRoomType = (floorIndex: number, unitIndex: number, roomType: string) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      const newRoomTypes = [...newFloors[floorIndex].roomTypes];
      newRoomTypes[unitIndex] = roomType;
      newFloors[floorIndex] = { ...newFloors[floorIndex], roomTypes: newRoomTypes };
      return { ...prev, floors: newFloors };
    });
  };

  const updateFloorUnitName = (floorIndex: number, unitIndex: number, unitName: string) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      const newUnitNames = [...newFloors[floorIndex].unitNames];
      newUnitNames[unitIndex] = unitName;
      newFloors[floorIndex] = { ...newFloors[floorIndex], unitNames: newUnitNames };
      return { ...prev, floors: newFloors };
    });
  };

  const addFloor = () => {
    const newFloorNumber = Math.max(...formData.floors.map((f) => f.floorNumber)) + 1;
    const generatedFloorName = generateFloorName(newFloorNumber);
    setFormData((prev) => ({
      ...prev,
      floors: [
        ...prev.floors,
        {
          floorNumber: newFloorNumber,
          unitsPerFloor: 2,
          roomTypes: Array(2).fill('1-Bedroom'),
          unitNames: ['Unit 1', 'Unit 2'],
          description: generatedFloorName,
        },
      ],
    }));
  };

  const removeFloor = (index: number) => {
    if (formData.floors.length > 1) {
      setFormData((prev) => ({
        ...prev,
        floors: prev.floors.filter((_, i) => i !== index),
      }));
    }
  };

  const updateUnitsPerFloor = (floorIndex: number, newCount: number) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      const currentCount = newFloors[floorIndex].roomTypes.length;
      const newRoomTypes = [...newFloors[floorIndex].roomTypes];
      const newUnitNames = [...newFloors[floorIndex].unitNames];

      if (newCount > currentCount) {
        // Add new rooms and unit names
        for (let i = currentCount; i < newCount; i++) {
          newRoomTypes.push('1-Bedroom');
          newUnitNames.push(`Unit ${i + 1}`);
        }
      } else if (newCount < currentCount) {
        // Remove rooms and unit names
        newRoomTypes.splice(newCount);
        newUnitNames.splice(newCount);
      }

      newFloors[floorIndex] = {
        ...newFloors[floorIndex],
        unitsPerFloor: newCount,
        roomTypes: newRoomTypes,
        unitNames: newUnitNames,
      };

      return { ...prev, floors: newFloors };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Property name is required');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Property address is required');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (formData.floors.length === 0) {
      toast.error('Property must have at least one floor');
      return false;
    }
    if (!formData.landlordFirstName.trim()) {
      toast.error('Landlord first name is required');
      return false;
    }
    if (!formData.landlordLastName.trim()) {
      toast.error('Landlord last name is required');
      return false;
    }
    if (!formData.landlordEmail.trim() || !formData.landlordEmail.includes('@')) {
      toast.error('Valid landlord email is required');
      return false;
    }
    if (!formData.landlordPassword) {
      toast.error('Landlord password is required');
      return false;
    }
    if (formData.landlordPassword.length < 8) {
      toast.error('Landlord password must be at least 8 characters');
      return false;
    }
    if (formData.landlordPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    // Validate room type pricing
    const uniqueRoomTypes = [...new Set(formData.floors.flatMap((f) => f.roomTypes))];
    for (const roomType of uniqueRoomTypes) {
      if (!formData.roomTypePrices[roomType] || formData.roomTypePrices[roomType] <= 0) {
        toast.error(`Price is required for ${roomType}`);
        return false;
      }
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
      const response = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          description: formData.description,
          propertyType: formData.propertyType,
          floors: formData.floors,
          landlordFirstName: formData.landlordFirstName,
          landlordLastName: formData.landlordLastName,
          landlordEmail: formData.landlordEmail,
          landlordPhone: formData.landlordPhone,
          landlordIdNumber: formData.landlordIdNumber,
          landlordPassword: formData.landlordPassword,
          roomTypePrices: formData.roomTypePrices,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error?.message || 'Failed to create property');
        return;
      }

      const result = await response.json();
      toast.success('Property created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/properties/${result.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('An error occurred while creating the property');
    } finally {
      setLoading(false);
    }
  };

  const roomTypeOptions = ['Bed-sitter', '1-Bedroom', '2-Bedroom', '3-Bedroom', '4-Bedroom'];

  const handleRoomTypePrice = (roomType: string, price: string) => {
    setFormData((prev) => ({
      ...prev,
      roomTypePrices: {
        ...prev.roomTypePrices,
        [roomType]: parseFloat(price) || 0,
      },
    }));
  };

  // Get unique room types from all floors
  const getUniqueRoomTypes = () => {
    const types = new Set<string>();
    formData.floors.forEach((floor) => {
      floor.roomTypes.forEach((roomType) => {
        types.add(roomType);
      });
    });
    return Array.from(types).sort();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Properties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Property</h1>
          <p className="text-gray-600 mt-2">Add property details, structure, and landlord information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Details Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1: Property Name | Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handlePropertyChange}
                  placeholder="e.g., Sunset Apartments"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handlePropertyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="villa">Villa</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              {/* Row 2: Street Address | Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handlePropertyChange}
                  placeholder="e.g., 123 Main Street"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handlePropertyChange}
                  placeholder="e.g., 00100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Row 3: Country | City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handlePropertyChange}
                  placeholder="e.g., Kenya"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handlePropertyChange}
                  placeholder="e.g., Nairobi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Row 4: Description (full width) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handlePropertyChange}
                  placeholder="Property details and amenities..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Property Structure Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Property Structure</h2>
              <Button
                type="button"
                onClick={addFloor}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                + Add Floor
              </Button>
            </div>

            <div className="space-y-6">
              {formData.floors.map((floor, floorIndex) => (
                <div
                  key={floorIndex}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">{floor.description || generateFloorName(floor.floorNumber)}</h3>
                    {formData.floors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFloor(floorIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Floor
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Number
                      </label>
                      <input
                        type="number"
                        value={floor.floorNumber}
                        onChange={(e) => {
                          const newFloorNumber = parseInt(e.target.value);
                          const newDescription = generateFloorName(newFloorNumber);
                          updateFloor(floorIndex, { floorNumber: newFloorNumber, description: newDescription });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Units on this Floor
                      </label>
                      <input
                        type="number"
                        value={floor.unitsPerFloor}
                        onChange={(e) =>
                          updateUnitsPerFloor(floorIndex, parseInt(e.target.value) || 1)
                        }
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Name/Description
                      </label>
                      <input
                        type="text"
                        value={floor.description || ''}
                        onChange={(e) => updateFloor(floorIndex, { description: e.target.value })}
                        placeholder={generateFloorName(floor.floorNumber)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 italic text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-generated: {generateFloorName(floor.floorNumber)}</p>
                    </div>
                  </div>

                  {/* Units Configuration */}
                  <div className="bg-white rounded p-3">
                    <p className="text-sm font-medium text-gray-700 mb-3">Units Configuration</p>
                    <div className="space-y-3">
                      {Array.from({ length: floor.unitsPerFloor }).map((_, unitIndex) => (
                        <div key={unitIndex} className="border border-gray-200 rounded p-3 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Unit Name *
                              </label>
                              <input
                                type="text"
                                value={floor.unitNames[unitIndex] || `Unit ${unitIndex + 1}`}
                                onChange={(e) =>
                                  updateFloorUnitName(floorIndex, unitIndex, e.target.value)
                                }
                                placeholder="e.g., F001, A101, Unit 1"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">Custom name for this unit</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Room Type *
                              </label>
                              <select
                                value={floor.roomTypes[unitIndex] || '1-Bedroom'}
                                onChange={(e) =>
                                  updateFloorRoomType(floorIndex, unitIndex, e.target.value)
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {roomTypeOptions.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <div className="bg-blue-50 rounded p-2 w-full text-center">
                                <p className="text-xs font-medium text-gray-600">Name: {floor.unitNames[unitIndex] || `Unit ${unitIndex + 1}`}</p>
                                <p className="text-xs text-gray-500">Type: {floor.roomTypes[unitIndex] || '1-Bedroom'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Type Pricing Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Room Type Pricing</h2>
            <p className="text-gray-600 text-sm mb-4">Set the monthly rent for each room type in your property</p>

            {getUniqueRoomTypes().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getUniqueRoomTypes().map((roomType) => (
                  <div key={roomType}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {roomType} - Monthly Rent *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">Ksh</span>
                      <input
                        type="number"
                        value={formData.roomTypePrices[roomType] || ''}
                        onChange={(e) => handleRoomTypePrice(roomType, e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Add at least one floor and unit to define room types
                </p>
              </div>
            )}
          </div>

          {/* Landlord Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Landlord Information</h2>

            {/* Note about landlord account creation */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 A landlord account will be created with this information. The landlord can use the email and password to login to the system and manage their property.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="landlordFirstName"
                  value={formData.landlordFirstName}
                  onChange={handleLandlordChange}
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
                  name="landlordLastName"
                  value={formData.landlordLastName}
                  onChange={handleLandlordChange}
                  placeholder="e.g., Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="landlordEmail"
                  value={formData.landlordEmail}
                  onChange={handleLandlordChange}
                  placeholder="landlord@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="landlordPhone"
                  value={formData.landlordPhone}
                  onChange={handleLandlordChange}
                  placeholder="e.g., +254712345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  name="landlordIdNumber"
                  value={formData.landlordIdNumber}
                  onChange={handleLandlordChange}
                  placeholder="e.g., 12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password (min 8 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showLandlordPassword ? 'text' : 'password'}
                    name="landlordPassword"
                    value={formData.landlordPassword}
                    onChange={handleLandlordChange}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLandlordPassword(!showLandlordPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showLandlordPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleLandlordChange}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center">
            <Link href="/dashboard/properties">
              <Button className="bg-gray-300 hover:bg-gray-400 text-gray-900">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

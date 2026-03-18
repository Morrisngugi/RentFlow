'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    idNumber: '',
    password: '',
    confirmPassword: '',
    officeName: '',
    officeLocation: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setError('ID number is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.officeName.trim()) {
      setError('Office name is required');
      return false;
    }
    if (!formData.officeLocation.trim()) {
      setError('Office location is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      
      // Step 1: Register the user (create User table entry with agent role)
      const registerResponse = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          idNumber: formData.idNumber,
          password: formData.password,
          role: 'agent',
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        let errorMessage = errorData.error?.message || errorData.error?.details?.[0] || errorData.message || 'Failed to create agent account';
        
        console.error(`❌ Registration failed (${registerResponse.status}):`, errorData);
        
        // Provide specific guidance for common errors
        if (errorMessage.includes('already')) {
          setError(`Email "${formData.email}" is already registered. Please use a different email address.`);
        } else if (errorMessage.includes('Email')) {
          setError(`Email error: ${errorMessage}. Please use a valid email.`);
        } else if (errorMessage.includes('Password')) {
          setError(`Password error: ${errorMessage}. Ensure it's at least 8 characters with uppercase, lowercase, numbers, and special characters.`);
        } else {
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      const registerData = await registerResponse.json();
      console.log('📋 Full registration response:', JSON.stringify(registerData, null, 2));
      
      // Try different paths to find the user ID
      let userId = 
        registerData.data?.user?.id ||
        registerData.user?.id ||
        registerData.data?.id ||
        registerData.id;
      
      console.log('🔍 Trying to extract ID:');
      console.log('  - registerData.data?.user?.id =', registerData.data?.user?.id);
      console.log('  - registerData.user?.id =', registerData.user?.id);
      console.log('  - registerData.data?.id =', registerData.data?.id);
      console.log('  - registerData.id =', registerData.id);
      console.log('  → Found userId:', userId);

      if (!userId) {
        console.error('❌ Could not extract user ID from any path');
        console.error('Full response:', JSON.stringify(registerData, null, 2));
        setError('Failed to get user ID from registration response');
        setLoading(false);
        return;
      }

      console.log('✅ User registered with ID:', userId);

      // Step 2: Create the agent profile with office details
      try {
        console.log('📝 Creating agent profile for userId:', userId);
        const profileResponse = await fetch(`${apiUrl}/agents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            userId: userId,
            officeName: formData.officeName,
            officeLocation: formData.officeLocation,
            isActive: true,
          }),
        });

        if (!profileResponse.ok) {
          const profileError = await profileResponse.json();
          console.warn(`⚠️ Agent profile creation failed (${profileResponse.status}):`, profileError);
          // Don't fail, just log - user creation was successful
        } else {
          const profileData = await profileResponse.json();
          console.log('✅ Agent profile created successfully:', profileData);
        }
      } catch (profileError) {
        console.error('❌ Error creating agent profile:', profileError);
        // Don't fail, just log - user creation was successful
      }

      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        idNumber: '',
        password: '',
        confirmPassword: '',
        officeName: '',
        officeLocation: '',
      });

      // Show success message for 3 seconds then redirect
      setTimeout(() => {
        console.log('✅ Agent creation complete, redirecting to dashboard...');
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create agent. Please try again.';
      setError(errorMsg);
      console.error('Error creating agent:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Add New Agent</h1>
        <p className="text-gray-600 text-lg">Create a new property management agent account</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Agent created successfully! Redirecting...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">ID Number *</label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Enter ID number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Office Information Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Office Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Office Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Office Name *</label>
                <input
                  type="text"
                  name="officeName"
                  value={formData.officeName}
                  onChange={handleInputChange}
                  placeholder="Enter office name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>

              {/* Office Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Office Location *</label>
                <input
                  type="text"
                  name="officeLocation"
                  value={formData.officeLocation}
                  onChange={handleInputChange}
                  placeholder="Enter office location"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Login Credentials</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-2">Password Requirements:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Minimum 8 characters</li>
                <li>Mix of uppercase and lowercase letters</li>
                <li>At least one number</li>
                <li>At least one special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-8 border-t-2 border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
            >
              {loading ? 'Creating Agent...' : '✓ Create Agent'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

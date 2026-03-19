'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  
  // Profile section state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  
  // Password section state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        const fullName = `${data.data.firstName} ${data.data.lastName}`;
        
        setName(fullName);
        setEmail(data.data.email);
        setOriginalName(fullName);
        setOriginalEmail(data.data.email);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessageType('error');
        setMessage('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Check if profile has changes
  const profileHasChanges = name !== originalName || email !== originalEmail;

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Split name into first and last
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: originalEmail, // Email cannot be changed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setOriginalName(name);
      setOriginalEmail(email);
      setMessageType('success');
      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  const handleCancelProfile = () => {
    setName(originalName);
    setEmail(originalEmail);
    setMessage('Changes cancelled');
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setMessageType('error');
      setMessage('Current password is required');
      return;
    }
    if (!newPassword) {
      setMessageType('error');
      setMessage('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to change password');
      }

      setMessageType('success');
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password change cancelled');
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600 text-lg">Manage your account and security settings</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-gray-600 py-8">
          <p>Loading your profile...</p>
        </div>
      )}

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`font-medium ${
            messageType === 'success' 
              ? 'text-green-800' 
              : 'text-red-800'
          }`}>{message}</p>
        </div>
      )}

      {/* Settings Grid */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Profile Information</h2>
          
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Enter your email"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={!profileHasChanges}
                className={`px-8 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  profileHasChanges
                    ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md'
                    : 'bg-green-200 text-green-800 cursor-not-allowed border border-green-300'
                }`}
              >
                💾 Save Changes
              </button>
              <button
                onClick={handleCancelProfile}
                disabled={!profileHasChanges}
                className={`px-8 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  profileHasChanges
                    ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-md'
                    : 'bg-amber-200 text-amber-800 cursor-not-allowed border border-amber-300'
                }`}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Change Password</h2>
          
          <div className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Enter current password"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Enter new password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Confirm new password"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword}
                className={`px-8 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  currentPassword && newPassword
                    ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md'
                    : 'bg-green-200 text-green-800 cursor-not-allowed border border-green-300'
                }`}
              >
                💾 Update Password
              </button>
              <button
                onClick={handleCancelPassword}
                disabled={!currentPassword && !newPassword && !confirmPassword}
                className={`px-8 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  currentPassword || newPassword || confirmPassword
                    ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-md'
                    : 'bg-amber-200 text-amber-800 cursor-not-allowed border border-amber-300'
                }`}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Password Requirements */}
      {!loading && (
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Password Requirements:</h3>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>Minimum 6 characters</li>
          <li>Use a mix of uppercase and lowercase letters</li>
          <li>Include at least one number</li>
          <li>Include at least one special character (!@#$%^&*)</li>
        </ul>
      </div>
      )}
    </div>
  );
}

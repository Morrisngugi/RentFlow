'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  
  // Profile section state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
  const [originalIdNumber, setOriginalIdNumber] = useState('');
  const [originalOfficeName, setOriginalOfficeName] = useState('');
  const [originalOfficeLocation, setOriginalOfficeLocation] = useState('');
  const [originalProfilePictureUrl, setOriginalProfilePictureUrl] = useState('');
  
  // Password section state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

        const response = await fetch(`${getApiUrl()}/auth/profile`, {
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
        setPhoneNumber(data.data.phoneNumber || '');
        setIdNumber(data.data.idNumber || '');
        setProfilePictureUrl(data.data.profilePictureUrl || '');
        setProfilePicturePreview(data.data.profilePictureUrl || '');
        
        setOriginalName(fullName);
        setOriginalEmail(data.data.email);
        setOriginalPhoneNumber(data.data.phoneNumber || '');
        setOriginalIdNumber(data.data.idNumber || '');
        setOriginalProfilePictureUrl(data.data.profilePictureUrl || '');
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
  const profileHasChanges = name !== originalName || email !== originalEmail || phoneNumber !== originalPhoneNumber || 
                           idNumber !== originalIdNumber || officeName !== originalOfficeName || 
                           officeLocation !== originalOfficeLocation || profilePictureUrl !== originalProfilePictureUrl;

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfilePicturePreview(dataUrl);
        setProfilePictureUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearProfilePicture = () => {
    setProfilePictureUrl('');
    setProfilePicturePreview('');
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch(`${getApiUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          idNumber,
          profilePictureUrl: profilePictureUrl || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        const errorMessage = errorData.error?.details?.[0] || errorData.error?.message || 'Failed to save profile';
        throw new Error(errorMessage);
      }

      setOriginalName(name);
      setOriginalEmail(email);
      setOriginalPhoneNumber(phoneNumber);
      setOriginalIdNumber(idNumber);
      setOriginalOfficeName(officeName);
      setOriginalOfficeLocation(officeLocation);
      setOriginalProfilePictureUrl(profilePictureUrl);
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
    setPhoneNumber(originalPhoneNumber);
    setIdNumber(originalIdNumber);
    setOfficeName(originalOfficeName);
    setOfficeLocation(originalOfficeLocation);
    setProfilePictureUrl(originalProfilePictureUrl);
    setProfilePicturePreview(originalProfilePictureUrl);
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
    if (newPassword.length < 8) {
      setMessageType('error');
      setMessage('Password must be at least 8 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
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
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
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
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setMessage('Password change cancelled');
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Settings</h1>
        <p className="text-gray-600 text-lg">Manage your account and profile information</p>
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
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">📧 Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Enter your phone number"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">ID Number</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                placeholder="Enter your ID number"
              />
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Profile Picture</label>
              {profilePicturePreview && (
                <div className="mb-4">
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile preview" 
                    className="w-32 h-32 rounded-lg object-cover border border-gray-300"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                />
                {profilePictureUrl && (
                  <button
                    onClick={handleClearProfilePicture}
                    type="button"
                    className="px-4 py-3 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 font-semibold transition-all"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">📸 JPG or PNG, max 5MB</p>
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
              <div className="flex gap-2">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  placeholder="Enter current password"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  type="button"
                  className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 font-semibold transition-all"
                >
                  {showCurrentPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
              <div className="flex gap-2">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  placeholder="Enter new password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  type="button"
                  className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 font-semibold transition-all"
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm New Password</label>
              <div className="flex gap-2">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue bg-white"
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  type="button"
                  className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 font-semibold transition-all"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
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
          <li>Minimum 8 characters</li>
          <li>Use a mix of uppercase and lowercase letters</li>
          <li>Include at least one number</li>
          <li>Include at least one special character (!@#$%^&*)</li>
        </ul>
      </div>
      )}
    </div>
  );
}


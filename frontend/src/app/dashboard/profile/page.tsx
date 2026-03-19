'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idNumber: string;
  profileImageUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        setProfile(user);
        setFormData(user);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!formData) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setProfile(formData);
      localStorage.setItem('user', JSON.stringify(formData));
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
    setError('');
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading profile...</div>;
  }

  if (!profile || !formData) {
    return <div className="text-center text-red-600">Failed to load profile</div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600 text-lg">Manage your agent profile information</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue ${
                editing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue ${
                editing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue ${
                editing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              disabled={!editing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rentflow-blue ${
                editing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-8 py-3 bg-rentflow-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="px-8 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                >
                  ✕ Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

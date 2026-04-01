'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/api';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    idNumber: '',
    password: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAgents(token);
  }, [router]);

  const fetchAgents = async (token: string) => {
    try {
      setAgents([]);
      setLoading(false);
    } catch (err) {
      setError('Failed to load agents');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        ...formData,
        role: 'agent',
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        idNumber: '',
        password: '',
      });
      setShowForm(false);
      await fetchAgents(token);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add agent');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow py-4 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-rentflow-navy">Agents</h1>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-rentflow-navy">Agents Management</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-rentflow-navy hover:bg-rentflow-teal text-white px-4 py-2 rounded-lg"
            >
              {showForm ? 'Cancel' : 'Add Agent'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleAddAgent} className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rentflow-navy outline-none"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rentflow-navy outline-none"
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rentflow-navy outline-none"
              />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rentflow-navy outline-none"
              />
              <input
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.idNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rentflow-navy outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rentflow-navy outline-none"
              />
              <button
                type="submit"
                className="w-full bg-rentflow-navy hover:bg-rentflow-teal text-white font-semibold py-2 rounded-lg"
              >
                Create Agent
              </button>
            </form>
          )}

          {agents.length === 0 ? (
            <p className="text-gray-600">No agents added yet. Click "Add Agent" to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b-2 border-rentflow-navy">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-rentflow-navy">Name</th>
                    <th className="px-4 py-3 font-semibold text-rentflow-navy">Email</th>
                    <th className="px-4 py-3 font-semibold text-rentflow-navy">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{agent.firstName} {agent.lastName}</td>
                      <td className="px-4 py-3">{agent.email}</td>
                      <td className="px-4 py-3">{agent.phoneNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
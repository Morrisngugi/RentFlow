'use client';

export default function LandlordsPage() {
  const landlords = [
    {
      id: 1,
      name: 'David Mwangi',
      email: 'david.mwangi@email.com',
      phone: '+254 720 123 456',
      properties: 5,
      totalRevenue: 'KES 450K',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Alice Kipchoge',
      email: 'alice.kipchoge@email.com',
      phone: '+254 722 234 567',
      properties: 3,
      totalRevenue: 'KES 290K',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Samuel Njoroge',
      email: 'samuel.njoroge@email.com',
      phone: '+254 723 345 678',
      properties: 7,
      totalRevenue: 'KES 620K',
      status: 'Active'
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Landlords</h1>
          <p className="text-gray-600 text-lg">Manage property owners and their details</p>
        </div>
        <button className="px-6 py-2 bg-rentflow-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Add Landlord
        </button>
      </div>

      {/* Landlords Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Landlord Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Properties</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Revenue</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {landlords.map((landlord) => (
                <tr key={landlord.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{landlord.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{landlord.email}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{landlord.phone}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{landlord.properties}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{landlord.totalRevenue}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {landlord.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-rentflow-blue hover:underline mr-4">Edit</button>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

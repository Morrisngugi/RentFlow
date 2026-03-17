'use client';

export default function PropertiesPage() {
  const properties = [
    {
      id: 1,
      name: 'Westlands Apartment Complex',
      location: 'Westlands, Nairobi',
      type: 'Apartment',
      units: 24,
      occupancy: '92%',
      landlord: 'David Mwangi',
      monthlyRevenue: 'KES 180K',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Karen Residential Estate',
      location: 'Karen, Nairobi',
      type: 'Estate',
      units: 45,
      occupancy: '88%',
      landlord: 'Samuel Njoroge',
      monthlyRevenue: 'KES 320K',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Kilimani Office Suites',
      location: 'Kilimani, Nairobi',
      type: 'Office',
      units: 18,
      occupancy: '95%',
      landlord: 'Alice Kipchoge',
      monthlyRevenue: 'KES 150K',
      status: 'Active'
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-600 text-lg">Manage all properties under your management</p>
        </div>
        <button className="px-6 py-2 bg-rentflow-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Add Property
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="h-40 bg-gradient-to-br from-rentflow-blue to-blue-700 relative flex items-center justify-center">
              <div className="text-white text-5xl">🏢</div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{property.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{property.location}</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">{property.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Units:</span>
                  <span className="font-medium text-gray-900">{property.units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Occupancy:</span>
                  <span className="font-medium text-green-600">{property.occupancy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly Revenue:</span>
                  <span className="font-semibold text-gray-900">{property.monthlyRevenue}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-rentflow-blue text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  View
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 text-sm rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

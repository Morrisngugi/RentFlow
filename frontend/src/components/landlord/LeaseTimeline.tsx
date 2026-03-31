'use client';

interface LeaseEvent {
  month: string;
  year: number;
  leaseCount: number;
  leases: {
    propertyName: string;
    unitName: string;
    tenantName: string;
  }[];
}

interface LeaseTimelineProps {
  events: LeaseEvent[];
  isLoading?: boolean;
}

export default function LeaseTimeline({ events, isLoading }: LeaseTimelineProps) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Lease Expiry Timeline (Next 12 Months)</h3>
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.year, months.indexOf(a.month));
    const dateB = new Date(b.year, months.indexOf(b.month));
    return dateA.getTime() - dateB.getTime();
  });

  const maxLeases = Math.max(...sortedEvents.map(e => e.leaseCount), 1);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Lease Expiry Timeline (Next 12 Months)</h3>
      
      {sortedEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No lease expirations in the next 12 months</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="flex items-end gap-1 h-40 bg-gray-50 p-4 rounded">
            {sortedEvents.map((event, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer group relative"
                  style={{ 
                    height: `${(event.leaseCount / maxLeases) * 150}px`,
                    minHeight: event.leaseCount > 0 ? '4px' : '0px'
                  }}
                  title={`${event.leaseCount} lease${event.leaseCount !== 1 ? 's' : ''}`}
                >
                  {event.leaseCount > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {event.leaseCount}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-700 mt-2">{event.month}</p>
                <p className="text-xs text-gray-500">{event.year}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {sortedEvents.filter(e => e.leaseCount > 0).map((event, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm text-gray-900">
                  {event.month} {event.year}
                </p>
                <p className="text-xs text-gray-600 mt-1">{event.leaseCount} lease{event.leaseCount !== 1 ? 's' : ''} expiring</p>
                <div className="mt-2 space-y-1">
                  {event.leases.map((lease, leaseIdx) => (
                    <p key={leaseIdx} className="text-xs text-gray-700">
                      {lease.propertyName} - {lease.unitName}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

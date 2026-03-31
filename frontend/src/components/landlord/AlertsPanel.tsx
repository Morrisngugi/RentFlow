'use client';

interface Alert {
  id: string;
  type: 'lease_expiring' | 'payment_overdue' | 'payment_pending' | 'property_vacancy';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
  actionUrl?: string;
}

interface AlertsProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export default function AlertsPanel({ alerts, isLoading }: AlertsProps) {
  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-l-4 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'lease_expiring':
        return '📅';
      case 'payment_overdue':
        return '🚨';
      case 'payment_pending':
        return '⏳';
      case 'property_vacancy':
        return '🏚️';
      default:
        return 'ℹ️';
    }
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">📢 Alerts & Notifications</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">📢 Alerts & Notifications</h3>
      
      {alerts.length === 0 ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-800">
          <p className="font-semibold">✓ All Good!</p>
          <p className="text-sm">No active alerts. Your properties are running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded ${getAlertStyles(alert.severity)} transition-all hover:shadow-md`}
            >
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">{getAlertIcon(alert.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs mt-1 opacity-90">{alert.description}</p>
                  <p className="text-xs mt-1 opacity-70">{new Date(alert.createdAt).toLocaleDateString()}</p>
                </div>
                {alert.actionUrl && (
                  <a
                    href={alert.actionUrl}
                    className="flex-shrink-0 px-2 py-1 bg-white rounded text-xs font-semibold hover:bg-gray-100 transition"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

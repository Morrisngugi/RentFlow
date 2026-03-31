'use client';

import Link from 'next/link';

interface SummaryData {
  totalProperties: number;
  activeLeases: number;
  expectedMonthlyRent: number;
  pendingPayments: number;
  occupancyRate: number;
}

interface DashboardSummaryProps {
  data: SummaryData;
  isLoading?: boolean;
}

export default function DashboardSummary({ data, isLoading }: DashboardSummaryProps) {
  const cards = [
    {
      title: 'Total Properties',
      value: data.totalProperties,
      icon: '🏠',
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/properties',
      subtext: 'properties managed',
    },
    {
      title: 'Active Leases',
      value: data.activeLeases,
      icon: '📄',
      color: 'from-green-500 to-green-600',
      href: '/dashboard/leases',
      subtext: 'active agreements',
    },
    {
      title: 'Expected Monthly Rent',
      value: `KES ${(data.expectedMonthlyRent || 0).toLocaleString()}`,
      icon: '💰',
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/payments',
      subtext: 'from occupied units',
    },
    {
      title: 'Pending Payments',
      value: data.pendingPayments,
      icon: '⚠️',
      color: 'from-orange-500 to-orange-600',
      href: '/dashboard/payments',
      subtext: 'awaiting collection',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Link key={index} href={card.href}>
          <div className={`bg-gradient-to-br ${card.color} rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all transform hover:scale-105`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="opacity-80 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
                <p className="text-xs opacity-70 mt-2">{card.subtext}</p>
              </div>
              <div className="text-4xl opacity-20">{card.icon}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

import { OrganizationMetrics as OrganizationMetricsType } from '@/types/admin';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  StarIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Props {
  metrics: OrganizationMetricsType;
}

export default function OrganizationMetrics({ metrics }: Props) {
  const stats = [
    {
      name: 'Total Coaches',
      value: metrics.totalCoaches,
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Total Clients',
      value: metrics.totalClients,
      icon: UserGroupIcon,
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+15%',
      changeType: 'increase'
    },
    {
      name: 'Client Retention',
      value: `${metrics.averageClientRetention}%`,
      icon: ChartBarIcon,
      change: '+5%',
      changeType: 'increase'
    },
    {
      name: 'Coach Rating',
      value: metrics.averageCoachRating.toFixed(1),
      icon: StarIcon,
      change: '+0.2',
      changeType: 'increase'
    },
    {
      name: 'Active Sessions',
      value: metrics.activeSessions,
      icon: CalendarIcon,
      change: '+18%',
      changeType: 'increase'
    },
    {
      name: 'Completed Sessions',
      value: metrics.completedSessions,
      icon: CheckCircleIcon,
      change: '+22%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Organization Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
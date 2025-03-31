import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import type { CoachAnalytics, ClientOverview } from '@/services/coachAnalyticsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface CoachDashboardProps {
  analytics: CoachAnalytics;
  className?: string;
}

export default function CoachDashboard({ analytics, className = '' }: CoachDashboardProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <MinusIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const healthCategoryData = {
    labels: Object.values(analytics.healthCategories).map(cat => cat.name),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(analytics.healthCategories).map(cat => cat.score),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Clients</h3>
          <p className="text-3xl font-bold">{analytics.totalClients}</p>
          <p className="text-sm text-gray-500 mt-2">
            {analytics.activeClients} active in last 7 days
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Average Consistency</h3>
          <p className="text-3xl font-bold">{analytics.averageConsistency.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-2">Across all clients</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Needs Attention</h3>
          <p className="text-3xl font-bold text-orange-500">
            {analytics.needsAttention.decliningMetrics.length}
          </p>
          <p className="text-sm text-gray-500 mt-2">Clients with declining metrics</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Recent Check-ins</h3>
          <p className="text-3xl font-bold">{analytics.recentCheckIns.length}</p>
          <p className="text-sm text-gray-500 mt-2">In the last 14 days</p>
        </div>
      </div>

      {/* Health Categories Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Health Categories Overview</h3>
          <div className="h-[400px]">
            <Radar data={healthCategoryData} options={radarOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Category Details</h3>
          <div className="space-y-4">
            {Object.values(analytics.healthCategories).map(category => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-500">
                    {category.clientCount} clients | {category.needsAttention} need attention
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-lg font-semibold">{category.score.toFixed(1)}</p>
                  {getTrendIcon(category.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Highest Consistency</h4>
            <div className="space-y-3">
              {analytics.topPerformers.consistency.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-green-600">{client.consistency}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Best Progress</h4>
            <div className="space-y-3">
              {analytics.topPerformers.progress.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-blue-600">{(client.overallProgress * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Longest Streaks</h4>
            <div className="space-y-3">
              {analytics.topPerformers.streak.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-purple-600">{client.checkInStreak} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Needs Attention</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Low Consistency</h4>
            <div className="space-y-3">
              {analytics.needsAttention.lowConsistency.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-red-600">{client.consistency}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">No Recent Check-in</h4>
            <div className="space-y-3">
              {analytics.needsAttention.noRecentCheckIn.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-orange-600">
                    {client.lastCheckIn ? formatDate(client.lastCheckIn) : 'Never'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Declining Metrics</h4>
            <div className="space-y-3">
              {analytics.needsAttention.decliningMetrics.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <div className="flex items-center">
                    <ArrowDownIcon className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Check-ins</h3>
        <div className="space-y-3">
          {analytics.recentCheckIns.map((checkIn, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{checkIn.clientName}</p>
                <p className="text-sm text-gray-500">{checkIn.summary}</p>
              </div>
              <p className="text-sm text-gray-500">{formatDate(checkIn.date)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
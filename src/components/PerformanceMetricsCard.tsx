'use client';

import { PerformanceMetrics } from '@/services/analyticsService';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

interface PerformanceMetricsCardProps {
  metrics: PerformanceMetrics;
}

export function PerformanceMetricsCard({ metrics }: PerformanceMetricsCardProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <MinusIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Overall Performance</h2>
        <div className="mt-2 text-4xl font-bold text-blue-600">
          {formatPercentage(metrics.overall)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(metrics.categories).map(([category, data]) => (
          <div key={category} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{category}</h3>
              {getTrendIcon(data.trend)}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.current)}
              </div>
              <div className="text-sm text-gray-600">
                Previous: {formatPercentage(data.previous)}
                <span className={`ml-2 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.change >= 0 ? '+' : ''}{formatPercentage(data.change)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="flex items-center space-x-3 bg-orange-50 p-4 rounded-lg">
          <FireIcon className="h-8 w-8 text-orange-500" />
          <div>
            <div className="text-lg font-semibold">Streak</div>
            <div className="text-2xl font-bold text-orange-600">{metrics.checkInStreak} days</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-green-50 p-4 rounded-lg">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
          <div>
            <div className="text-lg font-semibold">Completion Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(metrics.completionRate)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-lg">
          <div className="rounded-full bg-blue-500 p-2">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">Consistency</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(metrics.consistencyScore)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
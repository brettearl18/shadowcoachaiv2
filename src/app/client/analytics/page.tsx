'use client';

import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { ProgressChart } from '@/components/ProgressChart';
import { PerformanceMetricsCard } from '@/components/PerformanceMetricsCard';
import { clientService } from '@/services/clientService';
import { CheckInData } from '@/types/checkIn';

const AVAILABLE_METRICS = [
  'weight',
  'bodyFat',
  'muscleMass',
  'waistCircumference',
  'chestCircumference',
  'armCircumference',
];

const TIMEFRAME_OPTIONS = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last 12 Months' },
] as const;

export default function AnalyticsPage() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'bodyFat']);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const clientId = await clientService.getCurrentClientId();
        if (!clientId) {
          throw new Error('No client ID found');
        }
        const data = await clientService.getCheckIns(clientId);
        setCheckIns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const progressData = analyticsService.getProgressTrends(checkIns, selectedMetrics, timeframe);
  const performanceMetrics = analyticsService.getPerformanceMetrics(checkIns);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Progress Analytics</h1>

      <div className="mb-8">
        <PerformanceMetricsCard metrics={performanceMetrics} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Progress Trends</h2>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_METRICS.map(metric => (
                <button
                  key={metric}
                  onClick={() => handleMetricToggle(metric)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${selectedMetrics.includes(metric)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {TIMEFRAME_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${timeframe === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <ProgressChart
          data={progressData}
          title="Progress Over Time"
          height={400}
        />
      </div>
    </div>
  );
} 
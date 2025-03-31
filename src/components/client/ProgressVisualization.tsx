import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { CheckInData } from '@/types/checkIn';
import { ProgressMetrics } from '@/services/analyticsService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ProgressVisualizationProps {
  checkIns: CheckInData[];
  metrics: ProgressMetrics;
  isLoading?: boolean;
}

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  checkIns,
  metrics,
  isLoading = false
}) => {
  // Validate and process data
  const processedData = useMemo(() => {
    if (!checkIns || !metrics) {
      return null;
    }

    // Validate check-ins data
    const validCheckIns = checkIns.filter(checkIn => {
      const weight = parseFloat(checkIn.weight);
      const measurements = Object.values(checkIn.measurements || {}).map(v => parseFloat(v));
      return !isNaN(weight) && measurements.every(v => !isNaN(v));
    });

    if (validCheckIns.length === 0) {
      return null;
    }

    return {
      weightData: validCheckIns.map(checkIn => ({
        date: new Date(checkIn.date).toLocaleDateString(),
        weight: parseFloat(checkIn.weight),
        target: metrics.weight.target
      })),
      measurementData: validCheckIns.map(checkIn => ({
        date: new Date(checkIn.date).toLocaleDateString(),
        ...Object.entries(checkIn.measurements).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: parseFloat(value)
        }), {})
      })),
      categoryData: Object.entries(metrics.questionnaire.categories).map(([category, data]) => ({
        category,
        score: data.average,
        trend: data.trend
      }))
    };
  }, [checkIns, metrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-80 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weight Progress Chart */}
      <ErrorBoundary fallback={<ChartError />}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Weight Progress</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData.weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8884d8"
                  name="Weight"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#82ca9d"
                  name="Target"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ErrorBoundary>

      {/* Measurements Chart */}
      <ErrorBoundary fallback={<ChartError />}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Body Measurements</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData.measurementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(metrics.measurements).map((measurement, index) => (
                  <Line
                    key={measurement}
                    type="monotone"
                    dataKey={measurement}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                    name={measurement}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ErrorBoundary>

      {/* Category Scores Chart */}
      <ErrorBoundary fallback={<ChartError />}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Category Scores</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="score"
                  fill="#8884d8"
                  name="Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ErrorBoundary>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Check-in Streak"
          value={`${metrics.checkIns.streak} days`}
        />
        <MetricCard
          title="Consistency Score"
          value={`${metrics.checkIns.consistency}%`}
        />
        <MetricCard
          title="Total Check-ins"
          value={metrics.checkIns.total}
        />
        <MetricCard
          title="Average Score"
          value={`${metrics.questionnaire.averageScore}%`}
        />
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Milestones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Achieved Milestones */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Achieved</h4>
            <ul className="space-y-2">
              {metrics.milestones.achieved.map(milestone => (
                <li
                  key={milestone.id}
                  className="flex items-center text-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  {milestone.title}
                </li>
              ))}
            </ul>
          </div>
          {/* Upcoming Milestones */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Upcoming</h4>
            <ul className="space-y-2">
              {metrics.milestones.upcoming.map(milestone => (
                <li
                  key={milestone.id}
                  className="flex items-center text-sm"
                >
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  {milestone.title} ({milestone.progress}%)
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h4 className="text-sm font-medium text-gray-500">{title}</h4>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const ChartError: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-center py-8">
      <p className="text-red-500">Failed to load chart data</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  </div>
); 
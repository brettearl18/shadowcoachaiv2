import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import type { ProgressMetrics } from '@/services/analyticsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ClientAnalyticsProps {
  progress: ProgressMetrics;
  className?: string;
}

export default function ClientAnalytics({ progress, className = '' }: ClientAnalyticsProps) {
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
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const weightChartData = {
    labels: progress.weight.history.map(h => formatDate(h.date)),
    datasets: [
      {
        label: 'Weight (kg)',
        data: progress.weight.history.map(h => h.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Weight Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Weight Progress</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Current</p>
            <p className="text-2xl font-bold">{progress.weight.current}kg</p>
          </div>
          <div className="flex items-center">
            {getTrendIcon(progress.weight.trend)}
            <span className={`ml-1 ${
              progress.weight.change > 0 ? 'text-green-600' : 
              progress.weight.change < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {Math.abs(progress.weight.change)}kg
            </span>
          </div>
        </div>
        <div className="h-64">
          <Line data={weightChartData} options={chartOptions} />
        </div>
      </div>

      {/* Measurements Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Body Measurements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(progress.measurements).map(([type, data]) => (
            <div key={type} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 capitalize">{type}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xl font-semibold">{data.current}cm</p>
                <div className="flex items-center">
                  {getTrendIcon(data.trend)}
                  <span className={`ml-1 ${
                    data.change > 0 ? 'text-green-600' : 
                    data.change < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {Math.abs(data.change)}cm
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Check-in Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Check-in Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Check-ins</p>
            <p className="text-2xl font-bold">{progress.checkIns.total}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Current Streak</p>
            <p className="text-2xl font-bold">{progress.checkIns.streak} days</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Consistency</p>
            <p className="text-2xl font-bold">{progress.checkIns.consistency}%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Last Check-in</p>
            <p className="text-2xl font-bold">
              {progress.checkIns.lastCheckIn ? formatDate(progress.checkIns.lastCheckIn) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Questionnaire Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Wellness Score</h3>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-bold">{progress.questionnaire.averageScore.toFixed(1)}/5.0</p>
          </div>
          <div className="flex items-center">
            {getTrendIcon(progress.questionnaire.trend)}
            <span className="ml-2 text-sm text-gray-600">
              {progress.questionnaire.trend === 'up' ? 'Improving' :
               progress.questionnaire.trend === 'down' ? 'Declining' :
               'Stable'}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {Object.entries(progress.questionnaire.categories).map(([category, data]) => (
            <div key={category} className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{category}</p>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">{data.average.toFixed(1)}</span>
                {getTrendIcon(data.trend)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Milestones</h3>
        
        {/* Achieved Milestones */}
        {progress.milestones.achieved.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Achieved</h4>
            <div className="space-y-3">
              {progress.milestones.achieved.map(milestone => (
                <div key={milestone.id} className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm">{milestone.title}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {formatDate(milestone.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Milestones */}
        {progress.milestones.upcoming.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Upcoming</h4>
            <div className="space-y-4">
              {progress.milestones.upcoming.map(milestone => (
                <div key={milestone.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{milestone.title}</span>
                    <span>{milestone.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';
import { analyticsService } from '@/services/analyticsService';
import { ProgressChart } from '@/components/ProgressChart';
import { PerformanceMetricsCard } from '@/components/PerformanceMetricsCard';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface ClientProgress {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  lastCheckIn: string;
  metrics: {
    checkInStreak: number;
    completionRate: number;
    trend: 'up' | 'down' | 'stable';
    recentProgress: number;
  };
}

export function ClientProgressList() {
  const [clients, setClients] = useState<ClientProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'bodyFat']);

  useEffect(() => {
    loadClientProgress();
  }, []);

  const loadClientProgress = async () => {
    try {
      setLoading(true);
      const allClients = await clientService.getAllClients();
      
      const clientsProgress = await Promise.all(
        allClients.map(async (client) => {
          const checkIns = await clientService.getCheckIns(client.id);
          const metrics = await analyticsService.getPerformanceMetrics(checkIns);
          
          const recentProgress = checkIns.length >= 2
            ? ((checkIns[0].measurements?.weight || 0) - (checkIns[1].measurements?.weight || 0))
            : 0;

          return {
            clientId: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            lastCheckIn: checkIns[0]?.date || 'No check-ins',
            metrics: {
              checkInStreak: metrics.checkInStreak,
              completionRate: metrics.completionRate,
              trend: recentProgress > 0 ? 'up' : recentProgress < 0 ? 'down' : 'stable',
              recentProgress: Math.abs(recentProgress)
            }
          };
        })
      );

      setClients(clientsProgress);
    } catch (error) {
      console.error('Error loading client progress:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {clients.map(client => (
          <div
            key={client.clientId}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            {/* Client Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedClient(
                expandedClient === client.clientId ? null : client.clientId
              )}
            >
              <div className="flex items-center space-x-4">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Last Check-in</div>
                  <div className="font-medium">
                    {new Date(client.lastCheckIn).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(client.metrics.trend)}
                  <span className="font-medium text-gray-900">
                    {client.metrics.recentProgress.toFixed(1)} kg
                  </span>
                </div>
                {expandedClient === client.clientId ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedClient === client.clientId && (
              <div className="border-t p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Progress Chart */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="mb-4 flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">Progress Trends</h4>
                      <div className="flex space-x-2">
                        {(['week', 'month', 'year'] as const).map(timeframe => (
                          <button
                            key={timeframe}
                            onClick={() => setSelectedTimeframe(timeframe)}
                            className={`
                              px-3 py-1 rounded-full text-sm font-medium
                              ${selectedTimeframe === timeframe
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }
                            `}
                          >
                            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ProgressChart
                      data={{
                        labels: [],
                        datasets: []
                      }}
                      title=""
                      height={300}
                    />
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-4">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Check-in Streak</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {client.metrics.checkInStreak} days
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Completion Rate</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {client.metrics.completionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {/* Handle message */}}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Message Client
                  </button>
                  <button
                    onClick={() => {/* Handle schedule */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule Check-in
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {clients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No clients found
          </div>
        )}
      </div>
    </div>
  );
} 
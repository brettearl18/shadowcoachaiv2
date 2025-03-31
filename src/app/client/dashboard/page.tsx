'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
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
import ProgressPhotos from './components/ProgressPhotos';
import { clientService, ClientProfile, CheckInData } from '@/services/clientService';
import GoalsOverview from './components/GoalsOverview';
import CreateGoalForm from './components/CreateGoalForm';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [progressData, setProgressData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock user ID for testing
        const mockUserId = 'mock-user-123';
        
        // Fetch client profile
        const clientProfile = await clientService.getClientProfile(mockUserId);
        setProfile(clientProfile);

        // Fetch recent check-ins
        const { checkIns: recentCheckIns } = await clientService.getCheckInHistory(mockUserId, 5);
        setCheckIns(recentCheckIns);

        // Fetch progress data for weight (example metric)
        const weightProgress = await clientService.getProgressData(mockUserId, 'weight', 'month');
        setProgressData(weightProgress);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const progressChartData = {
    labels: progressData?.labels || [],
    datasets: progressData?.datasets || []
  };

  const progressChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '30-Day Progress'
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return value === null ? 'No data' : `${value} kg`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Weight (kg)'
        },
        ticks: {
          callback: (value: number) => value === null ? 'N/A' : `${value} kg`
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4 mx-auto" />
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Overview */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h2>
              <div className="h-80">
                <Line data={progressChartData} options={progressChartOptions} />
              </div>
            </div>

            {/* Goals Overview */}
            <GoalsOverview />

            {/* Recent Check-ins */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recent Check-ins</h2>
                <button
                  onClick={() => router.push('/client/check-ins')}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  View All
                </button>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {checkIns.map((checkIn) => (
                    <li key={checkIn.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              Check-in Completed
                            </p>
                            <p className="text-sm text-gray-500">
                              {checkIn.date.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/client/check-ins/${checkIn.id}`)}
                          className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          View Details
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Progress Photos */}
            <ProgressPhotos checkIns={checkIns} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/client/check-in')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Submit Check-in
                </button>
                <button
                  onClick={() => router.push('/client/goals/new')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create New Goal
                </button>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Achievements</h2>
              <div className="space-y-4">
                {/* Add achievements component here */}
                <p className="text-sm text-gray-500">No recent achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
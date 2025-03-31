'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import ClientProgressPhotos from '../../dashboard/components/ClientProgressPhotos';
import ProgressPhotoGallery from '@/components/ProgressPhotoGallery';
import { CheckInService } from '@/services/checkInService';
import ClientAnalytics from '@/components/ClientAnalytics';
import { analyticsService } from '@/services/analyticsService';

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  joinDate: string;
  checkInRate: number;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: string;
  status: 'active' | 'inactive';
}

export default function ClientProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [clientPhotos, setClientPhotos] = useState<Photo[]>([]);
  const [progress, setProgress] = useState<ProgressMetrics | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Fetch analytics data
        const analyticsData = await analyticsService.getClientProgress(params.id);
        setProgress(analyticsData);

        // Fetch photos
        const checkInService = new CheckInService();
        const photos = await checkInService.getClientPhotos(params.id);
        setClientPhotos(photos);
      } catch (error) {
        console.error('Error fetching client data:', error);
        setError('Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [params.id]);

  useEffect(() => {
    // Simulate loading client data
    setTimeout(() => {
      setClient({
        id: params.id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        organization: 'Acme Corp',
        joinDate: '2024-01-15',
        checkInRate: 92,
        currentStreak: 7,
        totalCheckIns: 28,
        lastCheckIn: '2024-03-20T10:30:00Z',
        status: 'active'
      });
    }, 1000);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Client not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/coach/clients')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Client Profile</h1>
          </div>

          {/* Client Info Card */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">{client.name}</h2>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.organization}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Join Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(client.joinDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Check-in Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.checkInRate}%</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Streak</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.currentStreak} days</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Check-ins</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{client.totalCheckIns}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Last Check-in</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {new Date(client.lastCheckIn).toLocaleDateString()}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Progress Photos</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">12</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Photos */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Progress Photos</h2>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : clientPhotos.length > 0 ? (
              <ProgressPhotoGallery photos={clientPhotos} />
            ) : (
              <div className="text-center text-gray-500 py-8">
                No progress photos available
              </div>
            )}
          </div>

          {/* Analytics & Insights */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Analytics & Insights</h2>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : progress ? (
              <ClientAnalytics progress={progress} />
            ) : (
              <div className="text-center text-gray-500 py-8">
                No analytics data available
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push(`/coach/clients/${client.id}/messages`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600 mr-3" />
                <span className="text-gray-900">Send Message</span>
              </div>
            </button>

            <button
              onClick={() => router.push(`/coach/clients/${client.id}/history`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-emerald-600 mr-3" />
                <span className="text-gray-900">View History</span>
              </div>
            </button>

            <button
              onClick={() => router.push(`/coach/clients/${client.id}/notes`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600 mr-3" />
                <span className="text-gray-900">Add Notes</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
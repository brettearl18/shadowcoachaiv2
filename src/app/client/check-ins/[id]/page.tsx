'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  CalendarIcon,
  ChartBarIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { clientService, CheckInData } from '@/services/clientService';
import { Line } from 'react-chartjs-2';

export default function CheckInDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInData | null>(null);
  const [progressData, setProgressData] = useState<{
    dates: string[];
    values: number[];
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        // Fetch check-in details
        const checkInData = await clientService.getCheckInDetails(user.uid, params.id);
        setCheckIn(checkInData);

        // Fetch progress data for comparison
        const progress = await clientService.getProgressData(user.uid, 'weight', 30);
        setProgressData({
          dates: progress.dates.map(date => date.toLocaleDateString()),
          values: progress.values
        });
      } catch (err) {
        console.error('Error fetching check-in details:', err);
        setError('Failed to load check-in details');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, params.id]);

  const progressChartData = {
    labels: progressData?.dates || [],
    datasets: [
      {
        label: 'Weight Progress',
        data: progressData?.values || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
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
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !checkIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Check-in not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to History
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Check-in Details
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {checkIn.date.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center">
                {checkIn.measurements.weight && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {checkIn.measurements.weight} kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Progress Chart */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h2>
                <div className="h-80">
                  <Line data={progressChartData} options={progressChartOptions} />
                </div>
              </div>

              {/* Measurements */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Measurements</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {Object.entries(checkIn.measurements).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Progress Photos */}
              {checkIn.photos.length > 0 && (
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Progress Photos</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {checkIn.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Progress photo ${index + 1}`}
                          className="rounded-lg object-cover h-64 w-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <button className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            View Full Size
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {checkIn.notes && (
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{checkIn.notes}</p>
                  </div>
                </div>
              )}

              {/* Coach Feedback */}
              {checkIn.coachFeedback && (
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Coach Feedback</h2>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-500 mt-1 mr-3" />
                      <p className="text-gray-700 whitespace-pre-wrap">{checkIn.coachFeedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Questionnaire Responses */}
              {Object.keys(checkIn.questionnaire).length > 0 && (
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Health Assessment</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(checkIn.questionnaire).map(([category, score]) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <dt className="text-sm font-medium text-gray-500 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </dt>
                          <div className="flex items-center">
                            <span className="text-lg font-semibold text-gray-900 mr-2">
                              {score}/10
                            </span>
                            {score >= 7 ? (
                              <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
                            ) : score <= 3 ? (
                              <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${(score / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
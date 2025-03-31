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
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { clientService } from '@/services/clientService';
import { CheckInData, CheckInFilters } from '@/types/checkIn';
import { Line } from 'react-chartjs-2';

export default function CheckInHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckInData[]>([]);
  const [filters, setFilters] = useState<CheckInFilters>({
    dateRange: 'all',
    showPhotos: true,
    showFeedback: true,
  });
  const [sortBy, setSortBy] = useState<'date' | 'weight'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInData | null>(null);
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await clientService.getCheckInHistory(user.uid, 20);
        setCheckIns(response.checkIns);
        setFilteredCheckIns(response.checkIns);
        setLastDoc(response.lastDoc);
        setHasMore(response.lastDoc !== null);
      } catch (err) {
        console.error('Error fetching check-in history:', err);
        setError('Failed to load check-in history');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await clientService.getCheckInHistory(auth.currentUser?.uid || '', 20, lastDoc);
      setCheckIns(prev => [...prev, ...response.checkIns]);
      setFilteredCheckIns(prev => [...prev, ...response.checkIns]);
      setLastDoc(response.lastDoc);
      setHasMore(response.lastDoc !== null);
    } catch (err) {
      console.error('Error loading more check-ins:', err);
      setError('Failed to load more check-ins');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let filtered = [...checkIns];

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.dateRange) {
        case '30days':
          startDate.setDate(now.getDate() - 30);
          filtered = filtered.filter(checkIn => checkIn.date >= startDate);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          filtered = filtered.filter(checkIn => checkIn.date >= startDate);
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            filtered = filtered.filter(checkIn => 
              checkIn.date >= customDateRange.start! && 
              checkIn.date <= customDateRange.end!
            );
          }
          break;
      }
    }

    // Apply photo filter
    if (filters.showPhotos) {
      filtered = filtered.filter(checkIn => checkIn.photos.length > 0);
    }

    // Apply feedback filter
    if (filters.showFeedback) {
      filtered = filtered.filter(checkIn => checkIn.coachFeedback);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return multiplier * (a.date.getTime() - b.date.getTime());
      } else {
        return multiplier * ((a.measurements.weight || 0) - (b.measurements.weight || 0));
      }
    });

    setFilteredCheckIns(filtered);
  }, [checkIns, filters, sortBy, sortOrder, customDateRange]);

  const progressChartData = {
    labels: filteredCheckIns.length > 0 
      ? filteredCheckIns.map(checkIn => checkIn.date.toLocaleDateString())
      : ['No data available'],
    datasets: [
      {
        label: 'Weight Progress',
        data: filteredCheckIns.length > 0
          ? filteredCheckIns.map(checkIn => checkIn.measurements.weight || null)
          : [null],
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
        text: 'Weight Progress Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: number) => value === null ? 'N/A' : `${value} kg`
        }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check-in History</h1>
          <button
            onClick={() => router.push('/client/check-in')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            New Check-in
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as CheckInFilters['dateRange'] }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {filters.dateRange === 'custom' && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'weight')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              >
                <option value="date">Date</option>
                <option value="weight">Weight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="flex items-end space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showPhotos}
                  onChange={(e) => setFilters(prev => ({ ...prev, showPhotos: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Photos Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showFeedback}
                  onChange={(e) => setFilters(prev => ({ ...prev, showFeedback: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Feedback Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h2>
          <div className="h-80">
            <Line data={progressChartData} options={progressChartOptions} />
          </div>
        </div>

        {/* Check-in List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Check-ins</h2>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {filteredCheckIns.map((checkIn) => (
                <li key={checkIn.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCheckIn(checkIn)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Check-in {checkIn.date.toLocaleDateString()}
                        </p>
                        <div className="flex items-center mt-1">
                          {checkIn.measurements.weight && (
                            <span className="text-sm text-gray-500 mr-4">
                              Weight: {checkIn.measurements.weight} kg
                            </span>
                          )}
                          {checkIn.photos.length > 0 && (
                            <span className="inline-flex items-center text-sm text-gray-500">
                              <PhotoIcon className="h-4 w-4 mr-1" />
                              {checkIn.photos.length} photos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {checkIn.coachFeedback && (
                        <span className="inline-flex items-center text-sm text-emerald-600 mr-4">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          Has feedback
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/client/check-ins/${checkIn.id}`);
                        }}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Check-in Details Modal */}
      {selectedCheckIn && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Check-in Details
                </h3>
                <button
                  onClick={() => setSelectedCheckIn(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedCheckIn.date.toLocaleString()}
                  </dd>
                </div>
                {selectedCheckIn.measurements.weight && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Weight</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedCheckIn.measurements.weight} kg
                    </dd>
                  </div>
                )}
                {selectedCheckIn.photos.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Progress Photos</dt>
                    <dd className="mt-1">
                      <div className="grid grid-cols-3 gap-4">
                        {selectedCheckIn.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Progress photo ${index + 1}`}
                            className="rounded-lg object-cover h-32 w-full"
                          />
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
                {selectedCheckIn.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedCheckIn.notes}
                    </dd>
                  </div>
                )}
                {selectedCheckIn.coachFeedback && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Coach Feedback</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedCheckIn.coachFeedback}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Add Load More button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
} 
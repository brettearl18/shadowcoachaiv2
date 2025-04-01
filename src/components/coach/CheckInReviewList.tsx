'use client';

import { useState, useEffect } from 'react';
import { CheckInData } from '@/types/checkIn';
import { clientService } from '@/services/clientService';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

// Mock data for development
const MOCK_CHECK_INS = [
  {
    id: '1',
    clientId: 'client1',
    clientName: 'John Smith',
    date: new Date('2024-03-20').toISOString(),
    reviewStatus: 'pending',
    measurements: {
      weight: 80.5,
      bodyFat: 18,
      chest: 100,
      waist: 85,
      hips: 95
    },
    scores: {
      overall: 85,
      categories: {
        nutrition: { score: 8, maxPossible: 10, percentage: 80 },
        training: { score: 9, maxPossible: 10, percentage: 90 },
        recovery: { score: 7, maxPossible: 10, percentage: 70 }
      }
    },
    notes: "Had a great week following the nutrition plan. Energy levels are improving.",
    photos: [
      "https://placehold.co/300x300/png",
      "https://placehold.co/300x300/png"
    ],
    aiSummary: "Strong performance this week with excellent adherence to nutrition (80%) and training (90%). Recovery could be improved. Overall trending positively with good energy levels.",
    weeklyProgress: 85 // percentage
  },
  {
    id: '2',
    clientId: 'client2',
    clientName: 'Sarah Johnson',
    date: new Date('2024-03-19').toISOString(),
    reviewStatus: 'reviewed',
    measurements: {
      weight: 65.2,
      bodyFat: 22,
      chest: 90,
      waist: 70,
      hips: 92
    },
    scores: {
      overall: 92,
      categories: {
        nutrition: { score: 9, maxPossible: 10, percentage: 90 },
        training: { score: 10, maxPossible: 10, percentage: 100 },
        recovery: { score: 8, maxPossible: 10, percentage: 80 }
      }
    },
    notes: "Completed all workouts and stayed on track with meal prep.",
    photos: [
      "https://placehold.co/300x300/png",
      "https://placehold.co/300x300/png"
    ],
    aiSummary: "Exceptional week with perfect training adherence (100%) and excellent nutrition compliance (90%). Recovery is solid at 80%. All metrics trending positively.",
    weeklyProgress: 92 // percentage
  },
  {
    id: '3',
    clientId: 'client3',
    clientName: 'Mike Wilson',
    date: new Date('2024-03-18').toISOString(),
    reviewStatus: 'flagged',
    measurements: {
      weight: 90.1,
      bodyFat: 25,
      chest: 110,
      waist: 95,
      hips: 105
    },
    scores: {
      overall: 65,
      categories: {
        nutrition: { score: 5, maxPossible: 10, percentage: 50 },
        training: { score: 7, maxPossible: 10, percentage: 70 },
        recovery: { score: 6, maxPossible: 10, percentage: 60 }
      }
    },
    notes: "Struggling with late-night cravings. Missed two workouts this week.",
    photos: [
      "https://placehold.co/300x300/png",
      "https://placehold.co/300x300/png"
    ],
    aiSummary: "Challenging week with nutrition being the main concern (50%). Training attendance dropped (70%) and recovery is suboptimal (60%). Immediate attention needed for late-night eating habits.",
    weeklyProgress: 65 // percentage
  }
];

interface CheckInReview extends CheckInData {
  clientName: string;
  clientId: string;
  reviewStatus: 'pending' | 'reviewed' | 'flagged';
}

type SortOption = 'date' | 'client' | 'status';
type SortOrder = 'asc' | 'desc';

export function CheckInReviewList() {
  const [checkIns, setCheckIns] = useState<CheckInReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'flagged'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadCheckIns();
  }, [dateRange]);

  const loadCheckIns = async () => {
    try {
      setLoading(true);
      // For development, use mock data instead of API calls
      const filteredByDate = filterCheckInsByDate(MOCK_CHECK_INS as CheckInReview[], dateRange);
      
      // Apply search filter
      const filteredBySearch = searchQuery
        ? filteredByDate.filter(checkIn => 
            checkIn.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            checkIn.notes?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : filteredByDate;

      // Apply status filter
      const filteredByStatus = filter === 'all'
        ? filteredBySearch
        : filteredBySearch.filter(checkIn => checkIn.reviewStatus === filter);

      // Apply sorting
      const sortedCheckIns = sortCheckIns(filteredByStatus, sortOption, sortOrder);
      
      setCheckIns(sortedCheckIns);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCheckInsByDate = (checkIns: CheckInReview[], range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return checkIns.filter(checkIn => {
          const checkInDate = new Date(checkIn.date);
          return checkInDate >= today;
        });
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return checkIns.filter(checkIn => {
          const checkInDate = new Date(checkIn.date);
          return checkInDate >= weekAgo;
        });
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return checkIns.filter(checkIn => {
          const checkInDate = new Date(checkIn.date);
          return checkInDate >= monthAgo;
        });
      default:
        return checkIns;
    }
  };

  const sortCheckIns = (checkIns: CheckInReview[], option: SortOption, order: SortOrder) => {
    return [...checkIns].sort((a, b) => {
      let comparison = 0;
      
      switch (option) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'client':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'status':
          comparison = a.reviewStatus.localeCompare(b.reviewStatus);
          break;
      }
      
      return order === 'asc' ? -comparison : comparison;
    });
  };

  const handleReview = async (checkInId: string, status: 'reviewed' | 'flagged') => {
    try {
      const checkInFeedback = feedback[checkInId] || '';
      // In development, just update the local state
      setCheckIns(prev => prev.map(checkIn => 
        checkIn.id === checkInId 
          ? { ...checkIn, reviewStatus: status }
          : checkIn
      ));

      setFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[checkInId];
        return newFeedback;
      });
    } catch (error) {
      console.error('Error updating check-in review:', error);
    }
  };

  const applyQuickFeedback = (checkInId: string, template: string) => {
    setFeedback(prev => ({
      ...prev,
      [checkInId]: template
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'flagged':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-100 text-green-800';
    if (progress >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getProgressIndicator = (progress: number) => {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${progress >= 80 ? 'bg-green-500' : progress >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
          {progress}%
        </span>
      </div>
    );
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
      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            {(['all', 'pending', 'reviewed', 'flagged'] as const).map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${filter === filterOption
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="date">Date</option>
              <option value="client">Client</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Check-ins List */}
      <div className="space-y-4">
        {checkIns.map(checkIn => (
          <div
            key={checkIn.id}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedId(expandedId === checkIn.id ? null : checkIn.id)}
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(checkIn.reviewStatus)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{checkIn.clientName}</h3>
                    {getProgressIndicator(checkIn.weeklyProgress)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {new Date(checkIn.date).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(checkIn.reviewStatus)}`}>
                      {checkIn.reviewStatus.charAt(0).toUpperCase() + checkIn.reviewStatus.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 pr-4">{checkIn.aiSummary}</p>
                </div>
              </div>
              {expandedId === checkIn.id ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </div>

            {/* Expanded Content */}
            {expandedId === checkIn.id && (
              <div className="border-t p-4">
                {/* Category Scores */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Category Scores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(checkIn.scores?.categories || {}).map(([category, score]) => (
                      <div key={category} className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-500 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${score.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{score.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Measurements */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Measurements</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(checkIn.measurements || {}).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded">
                        <div className="text-sm text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {checkIn.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Client Notes</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{checkIn.notes}</p>
                  </div>
                )}

                {/* Photos */}
                {checkIn.photos && checkIn.photos.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Progress Photos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {checkIn.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Progress photo ${index + 1}`}
                          className="rounded-lg object-cover w-full aspect-square"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Feedback Templates */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Quick Feedback</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Great progress! Keep up the good work!",
                      "Consider adjusting your routine slightly.",
                      "Let's discuss this in our next session.",
                      "Excellent effort this week!",
                      "Need to focus more on consistency."
                    ].map((template, index) => (
                      <button
                        key={index}
                        onClick={() => applyQuickFeedback(checkIn.id!, template)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Coach Feedback</h4>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={feedback[checkIn.id!] || ''}
                      onChange={(e) => setFeedback(prev => ({
                        ...prev,
                        [checkIn.id!]: e.target.value
                      }))}
                      placeholder="Enter your feedback for the client..."
                      className="flex-1 min-h-[100px] p-2 border rounded-lg"
                    />
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mt-2" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleReview(checkIn.id!, 'flagged')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Flag for Follow-up
                  </button>
                  <button
                    onClick={() => handleReview(checkIn.id!, 'reviewed')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Mark as Reviewed
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {checkIns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No check-ins to review
          </div>
        )}
      </div>
    </div>
  );
} 
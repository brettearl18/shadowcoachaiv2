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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface CheckInReview extends CheckInData {
  clientName: string;
  clientId: string;
  reviewStatus: 'pending' | 'reviewed' | 'flagged';
}

export function CheckInReviewList() {
  const [checkIns, setCheckIns] = useState<CheckInReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'flagged'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCheckIns();
  }, []);

  const loadCheckIns = async () => {
    try {
      setLoading(true);
      // In a real app, this would be filtered by coach ID
      const clients = await clientService.getAllClients();
      
      const allCheckIns: CheckInReview[] = [];
      for (const client of clients) {
        const clientCheckIns = await clientService.getCheckIns(client.id);
        const formattedCheckIns = clientCheckIns.map(checkIn => ({
          ...checkIn,
          clientName: `${client.firstName} ${client.lastName}`,
          clientId: client.id,
          reviewStatus: checkIn.coachReview?.status || 'pending'
        }));
        allCheckIns.push(...formattedCheckIns);
      }

      // Sort by date, most recent first
      allCheckIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCheckIns(allCheckIns);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (checkInId: string, status: 'reviewed' | 'flagged') => {
    try {
      const checkInFeedback = feedback[checkInId] || '';
      await clientService.updateCheckInReview(checkInId, {
        status,
        feedback: checkInFeedback,
        reviewedAt: new Date().toISOString()
      });

      setCheckIns(prev => prev.map(checkIn => 
        checkIn.id === checkInId 
          ? { ...checkIn, reviewStatus: status }
          : checkIn
      ));

      // Clear feedback for this check-in
      setFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[checkInId];
        return newFeedback;
      });
    } catch (error) {
      console.error('Error updating check-in review:', error);
    }
  };

  const filteredCheckIns = filter === 'all' 
    ? checkIns 
    : checkIns.filter(checkIn => checkIn.reviewStatus === filter);

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

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filter Controls */}
      <div className="mb-6 flex justify-between items-center">
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
        <span className="text-sm text-gray-600">
          {filteredCheckIns.length} check-in{filteredCheckIns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Check-ins List */}
      <div className="space-y-4">
        {filteredCheckIns.map(checkIn => (
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
                <div>
                  <h3 className="font-medium text-gray-900">{checkIn.clientName}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(checkIn.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {expandedId === checkIn.id ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {/* Expanded Content */}
            {expandedId === checkIn.id && (
              <div className="border-t p-4">
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
                          src={photo.url}
                          alt={`Progress photo ${index + 1}`}
                          className="rounded-lg object-cover w-full aspect-square"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Input */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Coach Feedback</h4>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={feedback[checkIn.id] || ''}
                      onChange={(e) => setFeedback(prev => ({
                        ...prev,
                        [checkIn.id]: e.target.value
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
                    onClick={() => handleReview(checkIn.id, 'flagged')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Flag for Follow-up
                  </button>
                  <button
                    onClick={() => handleReview(checkIn.id, 'reviewed')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Mark as Reviewed
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredCheckIns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No check-ins to review
          </div>
        )}
      </div>
    </div>
  );
} 
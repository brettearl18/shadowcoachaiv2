import React, { useState } from 'react';
import { CheckInData } from '@/types/checkIn';
import { notificationService } from '@/services/notificationService';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface CoachFeedbackProps {
  checkIn: CheckInData;
  onFeedbackSubmitted: () => void;
}

interface FeedbackState {
  overall: string;
  categories: {
    physical: string;
    nutrition: string;
    mental: string;
    lifestyle: string;
  };
  recommendations: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

const MIN_FEEDBACK_LENGTH = 10;
const MAX_FEEDBACK_LENGTH = 1000;

export const CoachFeedback: React.FC<CoachFeedbackProps> = ({ checkIn, onFeedbackSubmitted }) => {
  const [feedback, setFeedback] = useState<FeedbackState>({
    overall: '',
    categories: {
      physical: '',
      nutrition: '',
      mental: '',
      lifestyle: ''
    },
    recommendations: '',
    isSubmitting: false,
    error: null,
    success: false
  });

  const validateFeedback = (): string | null => {
    if (feedback.overall.length < MIN_FEEDBACK_LENGTH) {
      return `Overall feedback must be at least ${MIN_FEEDBACK_LENGTH} characters`;
    }

    if (feedback.overall.length > MAX_FEEDBACK_LENGTH) {
      return `Overall feedback cannot exceed ${MAX_FEEDBACK_LENGTH} characters`;
    }

    for (const [category, value] of Object.entries(feedback.categories)) {
      if (value.length < MIN_FEEDBACK_LENGTH) {
        return `${category} feedback must be at least ${MIN_FEEDBACK_LENGTH} characters`;
      }
      if (value.length > MAX_FEEDBACK_LENGTH) {
        return `${category} feedback cannot exceed ${MAX_FEEDBACK_LENGTH} characters`;
      }
    }

    if (feedback.recommendations.length < MIN_FEEDBACK_LENGTH) {
      return `Recommendations must be at least ${MIN_FEEDBACK_LENGTH} characters`;
    }

    if (feedback.recommendations.length > MAX_FEEDBACK_LENGTH) {
      return `Recommendations cannot exceed ${MAX_FEEDBACK_LENGTH} characters`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validationError = validateFeedback();
    if (validationError) {
      setFeedback(prev => ({ ...prev, error: validationError }));
      return;
    }

    setFeedback(prev => ({ ...prev, isSubmitting: true, error: null, success: false }));

    try {
      // Update check-in with feedback
      const checkInRef = doc(db, 'checkIns', checkIn.id);
      await updateDoc(checkInRef, {
        coachFeedback: {
          overall: feedback.overall,
          categories: feedback.categories,
          recommendations: feedback.recommendations,
          timestamp: serverTimestamp()
        }
      });

      // Send notification to client
      await notificationService.sendCoachFeedbackNotification(checkIn.id);

      // Reset form and show success
      setFeedback({
        overall: '',
        categories: {
          physical: '',
          nutrition: '',
          mental: '',
          lifestyle: ''
        },
        recommendations: '',
        isSubmitting: false,
        error: null,
        success: true
      });

      onFeedbackSubmitted();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, success: false }));
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedback(prev => ({
        ...prev,
        isSubmitting: false,
        error: 'Failed to submit feedback. Please try again.'
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Provide Feedback</h2>
      
      {/* Error Message */}
      {feedback.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{feedback.error}</p>
        </div>
      )}

      {/* Success Message */}
      {feedback.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">Feedback submitted successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Overall Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Feedback
          </label>
          <textarea
            value={feedback.overall}
            onChange={(e) => setFeedback(prev => ({ ...prev, overall: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Provide overall feedback on the client's progress..."
            required
            disabled={feedback.isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            {feedback.overall.length}/{MAX_FEEDBACK_LENGTH} characters
          </p>
        </div>

        {/* Category-specific Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(feedback.categories).map(([category, value]) => (
            <div key={category}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {category} Feedback
              </label>
              <textarea
                value={value}
                onChange={(e) => setFeedback(prev => ({
                  ...prev,
                  categories: {
                    ...prev.categories,
                    [category]: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={`Provide feedback on ${category}...`}
                required
                disabled={feedback.isSubmitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                {value.length}/{MAX_FEEDBACK_LENGTH} characters
              </p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recommendations
          </label>
          <textarea
            value={feedback.recommendations}
            onChange={(e) => setFeedback(prev => ({ ...prev, recommendations: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Provide specific recommendations for improvement..."
            required
            disabled={feedback.isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            {feedback.recommendations.length}/{MAX_FEEDBACK_LENGTH} characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={feedback.isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              feedback.isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {feedback.isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 
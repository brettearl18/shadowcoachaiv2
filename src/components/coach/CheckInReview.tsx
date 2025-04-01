import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
  FlagIcon,
  CheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface MeasurementChange {
  current: number;
  previousWeek: number;
  starting: number;
}

interface CategoryAnswer {
  question: string;
  answer: string;
}

interface CheckInData {
  id: string;
  clientName: string;
  date: string;
  status: 'pending' | 'reviewed' | 'flagged';
  overallScore: number;
  categoryScores: {
    nutrition: number;
    training: number;
    recovery: number;
  };
  measurements: {
    weight: MeasurementChange;
    bodyFat: MeasurementChange;
    chest: MeasurementChange;
    waist: MeasurementChange;
    hips: MeasurementChange;
  };
  categoryAnswers: {
    nutrition: CategoryAnswer[];
    training: CategoryAnswer[];
    recovery: CategoryAnswer[];
  };
  notes: string;
}

interface CheckInReviewProps {
  checkIn: CheckInData;
}

// Helper function to calculate percentage change
const calculateChange = (current: number, previous: number): string => {
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Helper function to render measurement with changes in compact form
const CompactMeasurement = ({ label, data }: { label: string; data: MeasurementChange }) => {
  const weekChange = ((data.current - data.previousWeek) / data.previousWeek) * 100;
  const totalChange = ((data.current - data.starting) / data.starting) * 100;
  
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-medium">{data.current}</span>
        <div className="flex flex-col gap-1 text-xs">
          <span className={weekChange <= 0 ? 'text-green-500' : 'text-red-500'}>
            {weekChange > 0 ? '↑' : '↓'} {Math.abs(weekChange).toFixed(1)}% week
          </span>
          <span className={totalChange <= 0 ? 'text-green-500' : 'text-red-500'}>
            {totalChange > 0 ? '↑' : '↓'} {Math.abs(totalChange).toFixed(1)}% total
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper function to render category section with score and answers
const CategorySection = ({ 
  label, 
  score, 
  answers 
}: { 
  label: string; 
  score: number; 
  answers: CategoryAnswer[] 
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-900 font-medium">{score}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-500 h-2.5 rounded-full" 
        style={{ width: `${score}%` }}
      />
    </div>
    <div className="mt-4 space-y-3">
      {answers.map((qa, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3">
          <div className="font-medium text-gray-900 mb-1">{qa.question}</div>
          <div className="text-gray-600">{qa.answer}</div>
        </div>
      ))}
    </div>
  </div>
);

export function CheckInReview({ checkIn }: CheckInReviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const quickFeedbackOptions = [
    'Great progress! Keep up the good work!',
    'Consider adjusting your routine slightly.',
    'Let\'s discuss this in our next session.',
    'Excellent effort this week!',
    'Need to focus more on consistency.'
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleQuickFeedback = (feedback: string) => {
    if (selectedFeedback.includes(feedback)) {
      setSelectedFeedback(prev => prev.filter(f => f !== feedback));
    } else {
      setSelectedFeedback(prev => [...prev, feedback]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">{checkIn.clientName}</h3>
            <div className="flex items-center space-x-2 text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">{formatDate(checkIn.date)}</span>
            </div>
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${checkIn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                checkIn.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'}
            `}>
              {checkIn.status.charAt(0).toUpperCase() + checkIn.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAnswersModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              View All Check-in Answers
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <p className="mt-2 text-gray-600">{checkIn.notes}</p>

        {/* Category Scores */}
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div 
              className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                setSelectedCategory('nutrition');
                setShowAnswersModal(true);
              }}
            >
              <div className="text-sm text-gray-500 mb-1">Nutrition</div>
              <div className="flex items-center justify-between">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${checkIn.categoryScores.nutrition}%` }} />
                </div>
                <span className="text-sm font-medium">{checkIn.categoryScores.nutrition}%</span>
              </div>
            </div>
            <div 
              className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                setSelectedCategory('training');
                setShowAnswersModal(true);
              }}
            >
              <div className="text-sm text-gray-500 mb-1">Training</div>
              <div className="flex items-center justify-between">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${checkIn.categoryScores.training}%` }} />
                </div>
                <span className="text-sm font-medium">{checkIn.categoryScores.training}%</span>
              </div>
            </div>
            <div 
              className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                setSelectedCategory('recovery');
                setShowAnswersModal(true);
              }}
            >
              <div className="text-sm text-gray-500 mb-1">Recovery</div>
              <div className="flex items-center justify-between">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${checkIn.categoryScores.recovery}%` }} />
                </div>
                <span className="text-sm font-medium">{checkIn.categoryScores.recovery}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Measurements Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <CompactMeasurement label="Weight" data={checkIn.measurements.weight} />
          <CompactMeasurement label="Body Fat" data={checkIn.measurements.bodyFat} />
          <CompactMeasurement label="Chest" data={checkIn.measurements.chest} />
          <CompactMeasurement label="Waist" data={checkIn.measurements.waist} />
          <CompactMeasurement label="Hips" data={checkIn.measurements.hips} />
        </div>

        {/* Overall Score */}
        <div className="mt-4 flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Overall Score</span>
            <span className={`
              px-2 py-1 rounded-full text-sm font-medium
              ${checkIn.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                checkIn.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'}
            `}>
              {checkIn.overallScore}%
            </span>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6">
            {/* Category Scores with Answers */}
            <div className="space-y-6 mb-8">
              <h4 className="font-medium text-gray-900">Categories & Responses</h4>
              <CategorySection 
                label="Nutrition" 
                score={checkIn.categoryScores.nutrition}
                answers={checkIn.categoryAnswers.nutrition}
              />
              <CategorySection 
                label="Training" 
                score={checkIn.categoryScores.training}
                answers={checkIn.categoryAnswers.training}
              />
              <CategorySection 
                label="Recovery" 
                score={checkIn.categoryScores.recovery}
                answers={checkIn.categoryAnswers.recovery}
              />
            </div>

            {/* Quick Feedback */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Quick Feedback</h4>
              <div className="flex flex-wrap gap-2">
                {quickFeedbackOptions.map((feedback, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickFeedback(feedback)}
                    className={`
                      px-3 py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedFeedback.includes(feedback)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {feedback}
                  </button>
                ))}
              </div>
            </div>

            {/* Coach Feedback */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Coach Feedback</h4>
              <div className="relative">
                <textarea
                  value={coachFeedback}
                  onChange={(e) => setCoachFeedback(e.target.value)}
                  placeholder="Enter your feedback for the client..."
                  className="w-full p-3 border rounded-lg min-h-[100px] resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => {/* TODO: Implement flag for follow-up */}}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
              >
                <FlagIcon className="h-4 w-4" />
                <span>Flag for Follow-up</span>
              </button>
              <button
                onClick={() => {/* TODO: Implement mark as reviewed */}}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center space-x-2"
              >
                <CheckIcon className="h-4 w-4" />
                <span>Mark as Reviewed</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Answers Modal */}
      {showAnswersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCategory ? (
                  `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Details - ${checkIn.clientName}`
                ) : (
                  `Check-in Details - ${checkIn.clientName}`
                )}
              </h3>
              <button
                onClick={() => {
                  setShowAnswersModal(false);
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {selectedCategory ? (
                // Show single category details
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 capitalize">{selectedCategory}</h4>
                    <span className="text-2xl font-bold text-blue-600">
                      {checkIn.categoryScores[selectedCategory]}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${checkIn.categoryScores[selectedCategory]}%` }}
                    />
                  </div>
                  <div className="space-y-4">
                    {checkIn.categoryAnswers[selectedCategory].map((qa, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-700 mb-2">{qa.question}</div>
                        <div className="text-gray-900">{qa.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Show all categories
                <div className="space-y-6">
                  {Object.entries(checkIn.categoryScores).map(([category, score]) => (
                    <div key={category} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-md font-medium text-gray-900 capitalize">{category}</h5>
                        <span className="text-lg font-semibold text-blue-600">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="space-y-3">
                        {checkIn.categoryAnswers[category].map((qa, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1">{qa.question}</div>
                            <div className="text-gray-900">{qa.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
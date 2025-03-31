import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface Question {
  id: number;
  category: 'physical' | 'nutrition' | 'mental' | 'lifestyle';
  text: string;
  description?: string;
  weight: number; // For weighted scoring
  options: {
    value: number;
    label: string;
    description?: string;
  }[];
}

const questions: Question[] = [
  // Physical Health Category
  {
    id: 1,
    category: 'physical',
    text: "How would you rate your energy levels today?",
    description: "Consider your overall energy throughout the day",
    weight: 1.0,
    options: [
      { value: 1, label: "Very Low", description: "Struggling to stay awake, feeling exhausted" },
      { value: 2, label: "Low", description: "Tired, but managing basic tasks" },
      { value: 3, label: "Moderate", description: "Average energy levels" },
      { value: 4, label: "High", description: "Feeling energetic and productive" },
      { value: 5, label: "Very High", description: "Excellent energy, feeling very dynamic" },
    ],
  },
  {
    id: 2,
    category: 'physical',
    text: "How would you rate your recovery from workouts?",
    description: "Consider muscle soreness and physical fatigue",
    weight: 1.2,
    options: [
      { value: 1, label: "Poor", description: "Excessive soreness, feeling overtrained" },
      { value: 2, label: "Below Average", description: "More sore than usual" },
      { value: 3, label: "Average", description: "Normal post-workout feeling" },
      { value: 4, label: "Good", description: "Minimal soreness, feeling fresh" },
      { value: 5, label: "Excellent", description: "Fully recovered, ready for intense training" },
    ],
  },
  // Nutrition Category
  {
    id: 3,
    category: 'nutrition',
    text: "How well did you follow your nutrition plan?",
    description: "Consider your adherence to planned meals and portions",
    weight: 1.5,
    options: [
      { value: 1, label: "Poor", description: "Completely off track" },
      { value: 2, label: "Fair", description: "Multiple deviations from plan" },
      { value: 3, label: "Good", description: "Minor deviations from plan" },
      { value: 4, label: "Very Good", description: "Followed plan with one small deviation" },
      { value: 5, label: "Excellent", description: "100% adherence to plan" },
    ],
  },
  {
    id: 4,
    category: 'nutrition',
    text: "How would you rate your hydration today?",
    description: "Consider your water intake throughout the day",
    weight: 1.0,
    options: [
      { value: 1, label: "Poor", description: "Much less than daily target" },
      { value: 2, label: "Fair", description: "Below daily target" },
      { value: 3, label: "Good", description: "Met basic requirements" },
      { value: 4, label: "Very Good", description: "Met daily target" },
      { value: 5, label: "Excellent", description: "Exceeded daily target" },
    ],
  },
  // Mental Health Category
  {
    id: 5,
    category: 'mental',
    text: "How would you rate your stress levels?",
    description: "Consider your mental and emotional state",
    weight: 1.3,
    options: [
      { value: 1, label: "Very High", description: "Feeling overwhelmed and anxious" },
      { value: 2, label: "High", description: "Notable stress affecting daily activities" },
      { value: 3, label: "Moderate", description: "Manageable stress levels" },
      { value: 4, label: "Low", description: "Feeling calm and in control" },
      { value: 5, label: "Very Low", description: "Extremely relaxed and peaceful" },
    ],
  },
  // Lifestyle Category
  {
    id: 6,
    category: 'lifestyle',
    text: "How was your sleep quality?",
    description: "Consider both duration and quality of sleep",
    weight: 1.4,
    options: [
      { value: 1, label: "Very Poor", description: "Less than 5 hours or very disrupted" },
      { value: 2, label: "Poor", description: "5-6 hours or frequently disrupted" },
      { value: 3, label: "Fair", description: "6-7 hours with some disruption" },
      { value: 4, label: "Good", description: "7-8 hours of mostly sound sleep" },
      { value: 5, label: "Excellent", description: "8+ hours of quality sleep" },
    ],
  },
];

interface CategoryScore {
  score: number;
  maxPossible: number;
  percentage: number;
}

interface QuestionnaireScores {
  overall: number;
  categories: Record<string, CategoryScore>;
}

interface CheckInQuestionnaireProps {
  onComplete: (answers: Record<number, number>, scores: QuestionnaireScores) => void;
}

export default function CheckInQuestionnaire({ onComplete }: CheckInQuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const calculateScores = (): QuestionnaireScores => {
    const categories: Record<string, CategoryScore> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Calculate scores for each category
    questions.forEach(q => {
      if (!categories[q.category]) {
        categories[q.category] = { score: 0, maxPossible: 0, percentage: 0 };
      }
      
      if (answers[q.id]) {
        const weightedScore = answers[q.id] * q.weight;
        categories[q.category].score += weightedScore;
        categories[q.category].maxPossible += 5 * q.weight; // 5 is max possible answer
        totalWeightedScore += weightedScore;
        totalWeight += q.weight;
      }
    });

    // Calculate percentages for each category
    Object.keys(categories).forEach(category => {
      categories[category].percentage = 
        (categories[category].score / categories[category].maxPossible) * 100;
    });

    return {
      overall: (totalWeightedScore / totalWeight),
      categories
    };
  };

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowDescription(false);
    } else {
      setShowResults(true);
    }
  };

  const handleComplete = () => {
    const scores = calculateScores();
    onComplete(answers, scores);
  };

  if (showResults) {
    const scores = calculateScores();
    const overallScore = scores.overall;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Check-in Summary</h2>
        
        {/* Overall Score */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-emerald-600">
              {overallScore.toFixed(1)}/5
            </div>
          </div>
          <div className="text-center text-gray-600">
            {overallScore >= 4 ? (
              <p className="flex items-center justify-center text-emerald-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Excellent progress! Keep up the great work!
              </p>
            ) : overallScore >= 3 ? (
              <p className="flex items-center justify-center text-blue-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Good progress! Let's keep pushing forward!
              </p>
            ) : (
              <p className="flex items-center justify-center text-amber-600">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                We'll work on improving these areas together.
              </p>
            )}
          </div>
        </div>

        {/* Category Scores */}
        <div className="space-y-4 mb-6">
          {Object.entries(scores.categories).map(([category, score]) => (
            <div key={category} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium capitalize">{category}</span>
                <span className="text-sm font-medium">
                  {score.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${score.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleComplete}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Continue to Check-in
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {!showResults ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {questions[currentQuestion].category}
            </span>
          </div>

          {/* Question */}
          <div className="relative">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {questions[currentQuestion].text}
            </h2>
            {questions[currentQuestion].description && (
              <p className="text-sm text-gray-500 mb-4">
                {questions[currentQuestion].description}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 relative z-10">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(questions[currentQuestion].id, option.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors
                  ${
                    answers[questions[currentQuestion].id] === option.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-gray-500">{option.value}/5</span>
                </div>
                {option.description && (
                  <p className="mt-1 text-sm text-gray-500">{option.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check-in Summary</h2>
          
          {/* Overall Score */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="text-4xl font-bold text-emerald-600">
                {calculateScores().overall.toFixed(1)}/5
              </div>
            </div>
            <div className="text-center text-gray-600">
              {calculateScores().overall >= 4 ? (
                <p className="flex items-center justify-center text-emerald-600">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Excellent progress! Keep up the great work!
                </p>
              ) : calculateScores().overall >= 3 ? (
                <p className="flex items-center justify-center text-blue-600">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Good progress! Let's keep pushing forward!
                </p>
              ) : (
                <p className="flex items-center justify-center text-amber-600">
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  We'll work on improving these areas together.
                </p>
              )}
            </div>
          </div>

          {/* Category Scores */}
          <div className="space-y-4 mb-6">
            {Object.entries(calculateScores().categories).map(([category, score]) => (
              <div key={category} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="text-sm font-medium">
                    {score.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${score.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleComplete}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Continue to Check-in
          </button>
        </div>
      )}
    </div>
  );
} 
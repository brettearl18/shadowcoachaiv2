'use client';

import { useState } from 'react';
import { CheckInReview } from '@/components/coach/CheckInReview';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MOCK_CHECK_INS = [
  {
    id: '1',
    clientName: 'John Smith',
    date: '2024-03-20',
    status: 'pending',
    overallScore: 85,
    categoryScores: {
      nutrition: 80,
      training: 90,
      recovery: 70
    },
    measurements: {
      weight: {
        current: 80.5,
        previousWeek: 81.2,
        starting: 85.0
      },
      bodyFat: {
        current: 18,
        previousWeek: 18.5,
        starting: 22
      },
      chest: {
        current: 100,
        previousWeek: 99,
        starting: 95
      },
      waist: {
        current: 85,
        previousWeek: 86,
        starting: 92
      },
      hips: {
        current: 95,
        previousWeek: 96,
        starting: 98
      }
    },
    categoryAnswers: {
      nutrition: [
        {
          question: "How well did you follow your meal plan?",
          answer: "Followed it strictly except for one meal on Saturday when I had a family dinner. Made good choices though - stuck to protein and vegetables."
        },
        {
          question: "Any digestive issues?",
          answer: "None this week. The probiotics seem to be helping."
        },
        {
          question: "How many meals did you eat per day?",
          answer: "Consistently had 5 meals - 3 main meals and 2 snacks as planned."
        },
        {
          question: "Water intake per day?",
          answer: "Averaging 3L per day, hitting the target consistently."
        },
        {
          question: "Any cravings or challenges?",
          answer: "Some sugar cravings mid-week but managed them with the approved snacks from the plan."
        }
      ],
      training: [
        {
          question: "Did you complete all scheduled workouts?",
          answer: "Yes, all 4 sessions completed with good intensity. Really pushed hard on leg day."
        },
        {
          question: "Any injuries or concerns?",
          answer: "No injuries, feeling strong. Some minor soreness in shoulders but nothing concerning."
        },
        {
          question: "Energy levels during workouts?",
          answer: "High energy throughout. The pre-workout timing we discussed is working well."
        },
        {
          question: "Were you able to progress in weights/reps?",
          answer: "Added 5kg to squat and 2.5kg to bench press this week."
        },
        {
          question: "How was your workout intensity?",
          answer: "8/10 for most sessions. Really focused on form and tempo as discussed."
        }
      ],
      recovery: [
        {
          question: "How was your sleep quality?",
          answer: "Average 7 hours, but waking up once or twice. Using the sleep tracking app you recommended."
        },
        {
          question: "Stress levels this week?",
          answer: "Moderate due to work deadlines. Used the breathing techniques which helped."
        },
        {
          question: "Are you following the recovery protocols?",
          answer: "Yes - doing the mobility work and using the foam roller daily."
        },
        {
          question: "Rate your overall fatigue (1-10):",
          answer: "6/10 - feeling the training but managing recovery well."
        },
        {
          question: "Any muscle soreness or stiffness?",
          answer: "Some soreness in legs after the heavy squat session, but normal range."
        }
      ]
    },
    notes: "Strong performance this week with excellent adherence to nutrition (80%) and training (90%). Recovery could be improved. Overall trending positively with good energy levels."
  },
  {
    id: '2',
    clientName: 'Sarah Johnson',
    date: '2024-03-19',
    status: 'reviewed',
    overallScore: 92,
    categoryScores: {
      nutrition: 95,
      training: 88,
      recovery: 93
    },
    measurements: {
      weight: {
        current: 65.2,
        previousWeek: 65.8,
        starting: 70.5
      },
      bodyFat: {
        current: 22,
        previousWeek: 22.5,
        starting: 25
      },
      chest: {
        current: 89,
        previousWeek: 89.5,
        starting: 92
      },
      waist: {
        current: 71,
        previousWeek: 71.5,
        starting: 76
      },
      hips: {
        current: 98,
        previousWeek: 98.5,
        starting: 102
      }
    },
    categoryAnswers: {
      nutrition: [
        {
          question: "How closely did you follow your meal plan?",
          answer: "100% adherence to the meal plan this week. Meal prepped everything on Sunday."
        },
        {
          question: "How are you finding the new meal timing?",
          answer: "The new meal timing is working great. No more afternoon energy crashes."
        },
        {
          question: "Are you hitting your protein targets?",
          answer: "Yes, averaging 130g per day using the tracking app."
        },
        {
          question: "How are the portion sizes working for you?",
          answer: "Perfect - feeling satisfied after meals without being overly full."
        },
        {
          question: "Any challenges with the diet?",
          answer: "None this week. The variety in the meal plan keeps things interesting."
        }
      ],
      training: [
        {
          question: "Completed workouts this week?",
          answer: "Did 5 out of 6 planned sessions. Missed Saturday due to family event."
        },
        {
          question: "How was your HIIT session performance?",
          answer: "Great! Maintained higher intensity throughout and recovery between sets improved."
        },
        {
          question: "Progress on main lifts?",
          answer: "New PR on deadlift (85kg) and improved pushup form significantly."
        },
        {
          question: "Any modifications needed?",
          answer: "Scaled back on jumping exercises due to downstairs neighbor complaints."
        },
        {
          question: "Rate your workout satisfaction (1-10):",
          answer: "9/10 - feeling stronger and more confident with all movements."
        }
      ],
      recovery: [
        {
          question: "Sleep quality and duration?",
          answer: "8-9 hours consistently. The new evening routine is really helping."
        },
        {
          question: "How effective was your rest day?",
          answer: "Very effective. Did light yoga and stretching as suggested."
        },
        {
          question: "Using the recovery tools?",
          answer: "Yes - compression boots post-workout and daily stretching routine."
        },
        {
          question: "Energy levels throughout the day?",
          answer: "Very stable. The mid-day walks are helping maintain energy."
        },
        {
          question: "Mental stress management?",
          answer: "Using the meditation app daily. Big improvement in stress handling."
        }
      ]
    },
    notes: "Exceptional week for Sarah. Nutrition compliance is outstanding and recovery protocols are showing great results. Minor adjustment needed for training schedule but overall progress is excellent."
  },
  {
    id: '3',
    clientName: 'Mike Wilson',
    date: '2024-03-18',
    status: 'flagged',
    overallScore: 65,
    categoryScores: {
      nutrition: 60,
      training: 75,
      recovery: 60
    },
    measurements: {
      weight: {
        current: 88.5,
        previousWeek: 88.0,
        starting: 86.0
      },
      bodyFat: {
        current: 24,
        previousWeek: 23.5,
        starting: 22
      },
      chest: {
        current: 105,
        previousWeek: 104,
        starting: 102
      },
      waist: {
        current: 89,
        previousWeek: 88,
        starting: 86
      },
      hips: {
        current: 102,
        previousWeek: 101,
        starting: 99
      }
    },
    categoryAnswers: {
      nutrition: [
        {
          question: "How many meals did you track this week?",
          answer: "Only tracked about 60% of meals. Work schedule made it difficult."
        },
        {
          question: "Main challenges with nutrition?",
          answer: "Late night meetings led to takeout 3 times. Struggled with meal prep."
        },
        {
          question: "Water intake goals met?",
          answer: "Below target - averaging 1.5L instead of planned 3L."
        },
        {
          question: "Any unplanned snacks or meals?",
          answer: "Several - stress eating during project deadlines."
        },
        {
          question: "Weekend nutrition adherence?",
          answer: "Poor - attended two social events and overindulged."
        }
      ],
      training: [
        {
          question: "Workouts completed vs planned?",
          answer: "Completed 3 out of 5 planned sessions. Morning sessions working better than evening."
        },
        {
          question: "Quality of workouts?",
          answer: "Good intensity when I made it to the gym. No issues with exercises."
        },
        {
          question: "Main barriers to training?",
          answer: "Work schedule and fatigue. Might need to adjust training times."
        },
        {
          question: "Energy levels during workouts?",
          answer: "Decent in morning sessions, poor in evening attempts."
        },
        {
          question: "Any positive training achievements?",
          answer: "Hit a new personal best on rows despite fewer sessions."
        }
      ],
      recovery: [
        {
          question: "Average sleep duration?",
          answer: "Only 5-6 hours most nights. Work stress affecting sleep quality."
        },
        {
          question: "Recovery methods used?",
          answer: "Skipped most recovery protocols except basic stretching."
        },
        {
          question: "Stress management?",
          answer: "High stress week at work. Haven't been using the stress management tools."
        },
        {
          question: "Weekend recovery quality?",
          answer: "Poor - late nights and irregular sleep pattern."
        },
        {
          question: "Physical stress symptoms?",
          answer: "Feeling some lower back tension and general fatigue."
        }
      ]
    },
    notes: "Challenging week for Mike. Work stress significantly impacting adherence to program. Need to discuss strategies for maintaining routine during high-stress periods. Flagged for immediate follow-up regarding sleep and stress management."
  }
];

export default function CheckInsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAnswers, setShowAnswers] = useState(false);

  const filteredCheckIns = MOCK_CHECK_INS.filter(checkIn => {
    const matchesSearch = checkIn.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checkIn.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || checkIn.status === statusFilter;
    
    // Add time filtering logic here
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="p-6">
      {/* Header with View Answers Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Check-in Reviews</h2>
          <p className="text-gray-600 mt-1">Review and respond to client check-ins</p>
        </div>
        <button
          onClick={() => setShowAnswers(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg flex items-center space-x-2 hover:bg-primary-dark transition-colors"
        >
          <DocumentTextIcon className="h-5 w-5" />
          <span>View Recent Check-in Answers</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by client name or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] p-2 border rounded-lg"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="p-2 border rounded-lg"
        >
          Date {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Check-in Count */}
      <div className="mb-4 text-gray-600">
        {filteredCheckIns.length} check-ins
      </div>

      {/* Check-in List */}
      <div className="space-y-4">
        {filteredCheckIns.map(checkIn => (
          <CheckInReview key={checkIn.id} checkIn={checkIn} />
        ))}
      </div>

      {/* Answers Modal */}
      {showAnswers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Check-in Answers</h3>
              <button
                onClick={() => setShowAnswers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {/* Add content for recent answers here */}
              <div className="space-y-6">
                {filteredCheckIns.map(checkIn => (
                  <div key={checkIn.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{checkIn.clientName}</h4>
                        <p className="text-sm text-gray-500">{formatDate(checkIn.date)}</p>
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
                    <div className="space-y-4">
                      {checkIn.categoryAnswers.nutrition.map((qa, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">{qa.question}</div>
                          <div className="font-medium text-gray-900 mb-2">{qa.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
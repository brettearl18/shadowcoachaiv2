import { useState, useEffect } from 'react';
import { Goal, GoalAnalytics } from '@/types/goals';
import { goalService } from '@/services/goalService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function GoalsOverview() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock user ID for testing
        const mockUserId = 'mock-user-123';
        
        const [goalsData, analyticsData] = await Promise.all([
          goalService.getGoals(mockUserId),
          goalService.getGoalAnalytics(mockUserId)
        ]);
        setGoals(goalsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError('Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
          <p className="ml-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Goals Overview</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">
              {analytics?.activeGoals || 0} Active Goals
            </span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500 mr-2" />
            <span className="text-sm text-gray-500">
              {analytics?.completedGoals || 0} Completed
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">{goal.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                goal.status === 'completed' 
                  ? 'bg-emerald-100 text-emerald-800'
                  : goal.status === 'active'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {goal.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{goal.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{goal.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{goal.current} {goal.unit}</span>
                <span>{goal.target} {goal.unit}</span>
              </div>
            </div>

            {goal.milestones.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Milestones</h4>
                <div className="space-y-2">
                  {goal.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center">
                      {milestone.completed ? (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-2" />
                      ) : (
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className="text-sm text-gray-500">
                        {milestone.title}: {milestone.current} / {milestone.target} {goal.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
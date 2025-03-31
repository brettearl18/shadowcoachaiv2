import { Goal, GoalAnalytics } from '@/types/goals';

// Mock data for testing
const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Weight Loss Goal',
    description: 'Lose 5kg in 3 months',
    type: 'weight',
    status: 'active',
    progress: 60,
    target: 70,
    current: 75,
    unit: 'kg',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    milestones: [
      {
        id: 'milestone-1',
        title: 'First kg down',
        target: 74,
        current: 74,
        completed: true
      },
      {
        id: 'milestone-2',
        title: 'Halfway there',
        target: 72.5,
        current: 73,
        completed: false
      }
    ]
  },
  {
    id: 'goal-2',
    title: 'Strength Training',
    description: 'Complete 3 strength training sessions per week',
    type: 'activity',
    status: 'active',
    progress: 80,
    target: 12,
    current: 10,
    unit: 'sessions',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-31'),
    milestones: [
      {
        id: 'milestone-3',
        title: 'First week completed',
        target: 3,
        current: 3,
        completed: true
      }
    ]
  }
];

const mockAnalytics: GoalAnalytics = {
  activeGoals: 2,
  completedGoals: 1,
  averageProgress: 70,
  upcomingMilestones: 2,
  recentAchievements: [
    {
      id: 'achievement-1',
      title: 'First Goal Milestone',
      date: new Date('2024-03-15'),
      type: 'milestone'
    }
  ]
};

class GoalService {
  async getGoals(clientId: string): Promise<Goal[]> {
    // Return mock data for testing
    if (clientId === 'mock-user-123') {
      return mockGoals;
    }
    throw new Error('Client not found');
  }

  async getGoalAnalytics(clientId: string): Promise<GoalAnalytics> {
    // Return mock data for testing
    if (clientId === 'mock-user-123') {
      return mockAnalytics;
    }
    throw new Error('Client not found');
  }

  async createGoal(clientId: string, goal: Omit<Goal, 'id'>): Promise<string> {
    // Mock implementation
    console.log('Creating goal for client:', clientId, goal);
    return 'new-goal-id';
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    // Mock implementation
    console.log('Updating goal:', goalId, updates);
  }

  async deleteGoal(goalId: string): Promise<void> {
    // Mock implementation
    console.log('Deleting goal:', goalId);
  }
}

export const goalService = new GoalService(); 
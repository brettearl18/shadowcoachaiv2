export interface Session {
  id: string;
  clientId: string;
  clientName: string;
  dateTime: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration: number;
  notes?: string;
  type: 'check-in' | 'goal-review' | 'progress-update';
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  activeGoals: number;
  completedGoals: number;
  lastCheckIn: Date;
  achievements: number;
  metrics: {
    weight?: number;
    measurements?: Record<string, number>;
    performance?: Record<string, number>;
  };
  streak: number;
  engagement: number;
}

export interface Activity {
  id: string;
  type: 'session' | 'goal' | 'checkIn' | 'achievement' | 'note';
  clientId: string;
  clientName: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  totalClients: number;
  activeGoals: number;
  todaySessions: number;
  totalAchievements: number;
  averageEngagement: number;
  successRate: number;
  revenue: number;
}

export interface CoachProfile {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  clients: string[];
  settings: {
    notifications: boolean;
    autoReminders: boolean;
    defaultSessionDuration: number;
  };
  metrics: {
    totalSessions: number;
    averageRating: number;
    clientRetention: number;
  };
} 
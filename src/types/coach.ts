export interface Session {
  id: string;
  clientId: string;
  clientName: string;
  dateTime: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration: number;
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  activeGoals: number;
  completedGoals: number;
  lastCheckIn: Date;
  achievements: number;
}

export interface Activity {
  id: string;
  type: 'session' | 'goal' | 'checkIn';
  clientId: string;
  clientName: string;
  description: string;
  timestamp: Date;
}

export interface CoachStats {
  totalClients: number;
  activeGoals: number;
  todaySessions: number;
  totalAchievements: number;
} 
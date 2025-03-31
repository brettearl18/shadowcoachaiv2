export interface CoachMetrics {
  totalClients: number;
  activeSessions: number;
  completedSessions: number;
  clientRetention: number;
  averageRating: number;
  revenue: number;
}

export interface CoachPerformance {
  coachId: string;
  name: string;
  email: string;
  organizationId: string;
  metrics: CoachMetrics;
  recentActivity: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
  topClients: {
    clientId: string;
    name: string;
    progress: number;
    engagement: number;
  }[];
}

export interface OrganizationMetrics {
  totalCoaches: number;
  totalClients: number;
  totalRevenue: number;
  averageClientRetention: number;
  averageCoachRating: number;
  activeSessions: number;
  completedSessions: number;
}

export interface AdminDashboardData {
  organizationMetrics: OrganizationMetrics;
  coaches: CoachPerformance[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: Date;
    coachId: string;
    coachName: string;
  }[];
} 
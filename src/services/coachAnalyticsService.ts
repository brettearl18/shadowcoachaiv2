import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  limit 
} from 'firebase/firestore';

export interface HealthCategory {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  clientCount: number;
  needsAttention: number;
}

export interface ClientOverview {
  id: string;
  name: string;
  lastCheckIn: Date | null;
  checkInStreak: number;
  consistency: number;
  overallProgress: number;
  healthCategories: {
    [key: string]: {
      score: number;
      trend: 'up' | 'down' | 'stable';
      lastUpdate: Date;
    };
  };
}

export interface CoachAnalytics {
  totalClients: number;
  activeClients: number;
  averageConsistency: number;
  healthCategories: {
    [key: string]: HealthCategory;
  };
  recentCheckIns: Array<{
    clientId: string;
    clientName: string;
    date: Date;
    type: string;
    summary: string;
  }>;
  clientInsights: ClientOverview[];
  topPerformers: {
    consistency: ClientOverview[];
    progress: ClientOverview[];
    streak: ClientOverview[];
  };
  needsAttention: {
    lowConsistency: ClientOverview[];
    noRecentCheckIn: ClientOverview[];
    decliningMetrics: ClientOverview[];
  };
}

class CoachAnalyticsService {
  private readonly CHECKINS_COLLECTION = 'checkIns';
  private readonly CLIENTS_COLLECTION = 'clients';
  private readonly HEALTH_CATEGORIES = [
    'Physical Health',
    'Mental Wellbeing',
    'Nutrition',
    'Sleep Quality',
    'Stress Management',
    'Recovery',
    'Exercise Adherence'
  ];

  async getCoachAnalytics(coachId: string): Promise<CoachAnalytics> {
    try {
      // Get all clients for the coach - simplified query
      const clientsRef = collection(db, this.CLIENTS_COLLECTION);
      const clientsQuery = query(
        clientsRef,
        where('coachId', '==', coachId)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clients = clientsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const dateA = a.lastCheckIn?.toDate?.() || new Date(0);
          const dateB = b.lastCheckIn?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      // Get recent check-ins - simplified query
      const checkInsRef = collection(db, this.CHECKINS_COLLECTION);
      const checkInsQuery = query(
        checkInsRef,
        where('coachId', '==', coachId)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      const checkIns = checkInsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(checkIn => {
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return checkIn.timestamp?.toDate?.() >= twoWeeksAgo;
        })
        .sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date(0);
          const dateB = b.timestamp?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      // Process client overviews
      const clientOverviews: ClientOverview[] = await Promise.all(
        clients.map(async client => {
          const clientCheckIns = checkIns.filter(
            checkIn => checkIn.clientId === client.id
          );

          const healthCategories = this.calculateHealthCategories(clientCheckIns);

          return {
            id: client.id,
            name: client.name,
            lastCheckIn: client.lastCheckIn?.toDate() || null,
            checkInStreak: client.currentStreak || 0,
            consistency: client.checkInRate || 0,
            overallProgress: this.calculateOverallProgress(healthCategories),
            healthCategories
          };
        })
      );

      // Calculate group analytics
      const healthCategories = this.calculateGroupHealthCategories(clientOverviews);
      const activeClients = clientOverviews.filter(
        client => client.lastCheckIn && 
        new Date().getTime() - client.lastCheckIn.getTime() < 7 * 24 * 60 * 60 * 1000
      ).length;

      // Sort clients by different metrics
      const sortedByConsistency = [...clientOverviews].sort((a, b) => b.consistency - a.consistency);
      const sortedByProgress = [...clientOverviews].sort((a, b) => b.overallProgress - a.overallProgress);
      const sortedByStreak = [...clientOverviews].sort((a, b) => b.checkInStreak - a.checkInStreak);

      // Identify clients needing attention
      const lowConsistency = clientOverviews.filter(client => client.consistency < 50);
      const noRecentCheckIn = clientOverviews.filter(
        client => !client.lastCheckIn || 
        new Date().getTime() - client.lastCheckIn.getTime() > 14 * 24 * 60 * 60 * 1000
      );
      const decliningMetrics = clientOverviews.filter(client => 
        Object.values(client.healthCategories).some(cat => cat.trend === 'down')
      );

      return {
        totalClients: clients.length,
        activeClients,
        averageConsistency: this.calculateAverageConsistency(clientOverviews),
        healthCategories,
        recentCheckIns: this.processRecentCheckIns(checkIns),
        clientInsights: clientOverviews,
        topPerformers: {
          consistency: sortedByConsistency.slice(0, 5),
          progress: sortedByProgress.slice(0, 5),
          streak: sortedByStreak.slice(0, 5)
        },
        needsAttention: {
          lowConsistency: lowConsistency.slice(0, 5),
          noRecentCheckIn: noRecentCheckIn.slice(0, 5),
          decliningMetrics: decliningMetrics.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Error fetching coach analytics:', error);
      throw new Error('Failed to fetch coach analytics');
    }
  }

  private calculateHealthCategories(checkIns: any[]): ClientOverview['healthCategories'] {
    const categories: ClientOverview['healthCategories'] = {};
    
    this.HEALTH_CATEGORIES.forEach(category => {
      const relevantAnswers = checkIns
        .filter(checkIn => checkIn.questionnaireAnswers?.[category])
        .map(checkIn => ({
          score: checkIn.questionnaireAnswers[category],
          date: checkIn.timestamp.toDate()
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (relevantAnswers.length > 0) {
        const recentScores = relevantAnswers.slice(0, 3);
        const averageScore = recentScores.reduce((sum, ans) => sum + ans.score, 0) / recentScores.length;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (recentScores.length >= 2) {
          const change = recentScores[0].score - recentScores[recentScores.length - 1].score;
          trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';
        }

        categories[category] = {
          score: averageScore,
          trend,
          lastUpdate: relevantAnswers[0].date
        };
      }
    });

    return categories;
  }

  private calculateGroupHealthCategories(clients: ClientOverview[]): CoachAnalytics['healthCategories'] {
    const groupCategories: CoachAnalytics['healthCategories'] = {};

    this.HEALTH_CATEGORIES.forEach(category => {
      const clientsWithCategory = clients.filter(
        client => client.healthCategories[category]
      );

      if (clientsWithCategory.length > 0) {
        const averageScore = clientsWithCategory.reduce(
          (sum, client) => sum + client.healthCategories[category].score, 
          0
        ) / clientsWithCategory.length;

        const needsAttention = clientsWithCategory.filter(
          client => 
            client.healthCategories[category].score < 3 ||
            client.healthCategories[category].trend === 'down'
        ).length;

        const trends = clientsWithCategory.map(
          client => client.healthCategories[category].trend
        );
        
        const trend = this.calculateGroupTrend(trends);

        groupCategories[category] = {
          name: category,
          score: averageScore,
          trend,
          clientCount: clientsWithCategory.length,
          needsAttention
        };
      }
    });

    return groupCategories;
  }

  private calculateGroupTrend(trends: ('up' | 'down' | 'stable')[]): 'up' | 'down' | 'stable' {
    const counts = trends.reduce((acc, trend) => {
      acc[trend] = (acc[trend] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (counts.up > counts.down && counts.up > counts.stable) return 'up';
    if (counts.down > counts.up && counts.down > counts.stable) return 'down';
    return 'stable';
  }

  private calculateOverallProgress(categories: ClientOverview['healthCategories']): number {
    const scores = Object.values(categories).map(cat => cat.score);
    return scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  }

  private calculateAverageConsistency(clients: ClientOverview[]): number {
    return clients.length > 0
      ? clients.reduce((sum, client) => sum + client.consistency, 0) / clients.length
      : 0;
  }

  private processRecentCheckIns(checkIns: any[]): CoachAnalytics['recentCheckIns'] {
    return checkIns.slice(0, 10).map(checkIn => ({
      clientId: checkIn.clientId,
      clientName: checkIn.clientName || 'Unknown Client',
      date: checkIn.timestamp.toDate(),
      type: 'Check-in',
      summary: this.generateCheckInSummary(checkIn)
    }));
  }

  private generateCheckInSummary(checkIn: any): string {
    const changes: string[] = [];

    if (checkIn.weight) {
      changes.push(`Weight: ${checkIn.weight}kg`);
    }

    if (checkIn.questionnaireAnswers) {
      const avgScore = Object.values(checkIn.questionnaireAnswers).reduce(
        (sum: number, score: number) => sum + score, 0
      ) / Object.values(checkIn.questionnaireAnswers).length;
      changes.push(`Wellness Score: ${avgScore.toFixed(1)}/5`);
    }

    return changes.join(' | ');
  }
}

export const coachAnalyticsService = new CoachAnalyticsService(); 
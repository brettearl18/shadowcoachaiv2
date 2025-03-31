import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { CheckInData } from '@/types/checkIn';

export interface ProgressMetrics {
  weight: {
    current: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    history: { date: Date; value: number }[];
  };
  measurements: {
    [key: string]: {
      current: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
      history: { date: Date; value: number }[];
    };
  };
  checkIns: {
    total: number;
    streak: number;
    consistency: number;
    lastCheckIn: Date | null;
  };
  questionnaire: {
    averageScore: number;
    trend: 'up' | 'down' | 'stable';
    categories: {
      [key: string]: {
        average: number;
        trend: 'up' | 'down' | 'stable';
      };
    };
  };
  milestones: {
    achieved: Array<{
      id: string;
      title: string;
      date: Date;
      type: 'weight' | 'measurement' | 'streak' | 'consistency';
    }>;
    upcoming: Array<{
      id: string;
      title: string;
      progress: number;
      type: 'weight' | 'measurement' | 'streak' | 'consistency';
    }>;
  };
}

interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string;
}

interface TrendData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    trend?: number; // Percentage change
  }[];
}

interface PerformanceMetrics {
  overall: number;
  categories: {
    [key: string]: {
      current: number;
      previous: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  checkInStreak: number;
  completionRate: number;
  consistencyScore: number;
}

export interface EnhancedAnalytics {
  performance: PerformanceMetrics;
  trends: TrendData;
  insights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    riskFactors: {
      category: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }[];
  };
  engagement: {
    checkInRate: number;
    responseTime: number;
    interactionScore: number;
    lastInteraction: Date;
  };
  goals: {
    current: {
      id: string;
      title: string;
      progress: number;
      deadline: Date;
    }[];
    completed: {
      id: string;
      title: string;
      completionDate: Date;
      successRate: number;
    }[];
  };
}

export class AnalyticsService {
  private readonly CHECKINS_COLLECTION = 'checkIns';
  private readonly CLIENTS_COLLECTION = 'clients';
  private readonly MAX_CHECKINS = 100; // Limit for performance
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getClientProgress(clientId: string): Promise<ProgressMetrics> {
    try {
      // Validate clientId
      if (!clientId || typeof clientId !== 'string') {
        throw new Error('Invalid client ID');
      }

      // Fetch all check-ins for the client with limit
      const checkInsRef = collection(db, this.CHECKINS_COLLECTION);
      const q = query(
        checkInsRef,
        where('clientId', '==', clientId),
        orderBy('timestamp', 'desc'),
        limit(this.MAX_CHECKINS)
      );
      const querySnapshot = await getDocs(q);
      const checkIns = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...this.validateCheckInData(data)
        };
      });

      // Get client data with validation
      const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
      const clientDoc = await getDoc(clientRef);
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      const clientData = this.validateClientData(clientDoc.data());

      // Calculate metrics with error handling
      const weightHistory = this.processWeightHistory(checkIns);
      const measurements = this.processMeasurements(checkIns);
      const questionnaireMetrics = this.calculateQuestionnaireMetrics(checkIns);
      const milestones = await this.calculateMilestones(clientId, {
        weight: weightHistory,
        measurements,
        checkIns: clientData
      });

      return {
        weight: {
          ...this.calculateMetrics(weightHistory),
          history: weightHistory
        },
        measurements,
        checkIns: {
          total: clientData?.totalCheckIns || 0,
          streak: clientData?.currentStreak || 0,
          consistency: clientData?.checkInRate || 0,
          lastCheckIn: clientData?.lastCheckIn?.toDate() || null
        },
        questionnaire: questionnaireMetrics,
        milestones
      };
    } catch (error) {
      console.error('Error fetching client progress:', error);
      throw new Error('Failed to fetch client progress');
    }
  }

  private validateCheckInData(data: any): any {
    const requiredFields = ['clientId', 'timestamp', 'weight', 'measurements'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate measurements
    const measurements = data.measurements || {};
    Object.entries(measurements).forEach(([key, value]) => {
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(`Invalid measurement value for ${key}`);
      }
      measurements[key] = parseFloat(value.toString());
      if (isNaN(measurements[key])) {
        throw new Error(`Invalid number format for ${key}`);
      }
    });

    // Validate weight
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight < 0) {
      throw new Error('Invalid weight value');
    }

    return {
      ...data,
      weight,
      measurements
    };
  }

  private validateClientData(data: any): any {
    if (!data) {
      throw new Error('Client data is null or undefined');
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'coachId'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required client fields: ${missingFields.join(', ')}`);
    }

    // Validate numeric fields
    const numericFields = ['totalCheckIns', 'currentStreak', 'checkInRate'];
    numericFields.forEach(field => {
      if (data[field] !== undefined) {
        const value = parseFloat(data[field]);
        if (isNaN(value) || value < 0) {
          throw new Error(`Invalid ${field} value`);
        }
        data[field] = value;
      }
    });

    return data;
  }

  private processWeightHistory(checkIns: any[]): { date: Date; value: number }[] {
    return checkIns
      .map(checkIn => ({
        date: checkIn.timestamp.toDate(),
        value: parseFloat(checkIn.weight)
      }))
      .filter(item => !isNaN(item.value))
      .reverse();
  }

  private processMeasurements(checkIns: any[]): ProgressMetrics['measurements'] {
    const measurementTypes = ['chest', 'waist', 'hips', 'arms', 'legs'];
    const measurements: ProgressMetrics['measurements'] = {};

    measurementTypes.forEach(type => {
      const history = checkIns
        .map(checkIn => ({
          date: checkIn.timestamp.toDate(),
          value: parseFloat(checkIn.measurements[type])
        }))
        .filter(item => !isNaN(item.value))
        .reverse();

      measurements[type] = this.calculateMetrics(history);
    });

    return measurements;
  }

  private calculateMetrics(history: { date: Date; value: number }[]) {
    if (history.length === 0) {
      return {
        current: 0,
        change: 0,
        trend: 'stable' as const,
        history: []
      };
    }

    const current = history[history.length - 1].value;
    const first = history[0].value;
    const change = current - first;

    // Calculate trend based on last 3 entries
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (history.length >= 3) {
      const recent = history.slice(-3).map(h => h.value);
      const avgChange = (recent[2] - recent[0]) / 2;
      trend = avgChange > 0.5 ? 'up' : avgChange < -0.5 ? 'down' : 'stable';
    }

    return {
      current,
      change,
      trend,
      history
    };
  }

  private calculateQuestionnaireMetrics(checkIns: any[]): ProgressMetrics['questionnaire'] {
    const recentCheckIns = checkIns.slice(0, 5); // Last 5 check-ins
    const scores = recentCheckIns
      .filter(checkIn => checkIn.questionnaireAnswers)
      .map(checkIn => {
        const answers = checkIn.questionnaireAnswers;
        return Object.values(answers).reduce((sum: number, val: number) => sum + val, 0) / Object.values(answers).length;
      });

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (scores.length >= 3) {
      const avgChange = (scores[0] - scores[scores.length - 1]) / scores.length;
      trend = avgChange > 0.3 ? 'up' : avgChange < -0.3 ? 'down' : 'stable';
    }

    // Group questions by categories (example categories)
    const categories = {
      'Physical Health': { average: 0, trend: 'stable' as const },
      'Mental Wellbeing': { average: 0, trend: 'stable' as const },
      'Nutrition': { average: 0, trend: 'stable' as const },
      'Recovery': { average: 0, trend: 'stable' as const }
    };

    return {
      averageScore,
      trend,
      categories
    };
  }

  private async calculateMilestones(
    clientId: string,
    data: any
  ): Promise<ProgressMetrics['milestones']> {
    const achieved = [];
    const upcoming = [];

    // Weight milestones
    if (data.weight.length >= 2) {
      const totalWeightChange = Math.abs(data.weight[0].value - data.weight[data.weight.length - 1].value);
      
      if (totalWeightChange >= 5) {
        achieved.push({
          id: 'weight-5',
          title: '5kg Weight Change',
          date: new Date(),
          type: 'weight' as const
        });
      }
      
      if (totalWeightChange < 10) {
        upcoming.push({
          id: 'weight-10',
          title: '10kg Weight Change',
          progress: (totalWeightChange / 10) * 100,
          type: 'weight' as const
        });
      }
    }

    // Streak milestones
    const streak = data.checkIns.currentStreak;
    if (streak >= 7) {
      achieved.push({
        id: 'streak-7',
        title: '7-Day Streak',
        date: new Date(),
        type: 'streak' as const
      });
    }
    
    if (streak < 30) {
      upcoming.push({
        id: 'streak-30',
        title: '30-Day Streak',
        progress: (streak / 30) * 100,
        type: 'streak' as const
      });
    }

    return {
      achieved,
      upcoming
    };
  }

  private generatePeriods(timeframe: 'week' | 'month' | 'year'): AnalyticsPeriod[] {
    const periods: AnalyticsPeriod[] = [];
    const now = new Date();
    let count: number;
    let unit: 'day' | 'month';

    switch (timeframe) {
      case 'week':
        count = 7;
        unit = 'day';
        break;
      case 'month':
        count = 30;
        unit = 'day';
        break;
      case 'year':
        count = 12;
        unit = 'month';
        break;
    }

    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(now);
      if (unit === 'day') {
        start.setDate(start.getDate() - i);
        periods.push({
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(start.setHours(23, 59, 59, 999)),
          label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      } else {
        start.setMonth(start.getMonth() - i);
        periods.push({
          start: new Date(start.getFullYear(), start.getMonth(), 1),
          end: new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999),
          label: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
      }
    }
    return periods;
  }

  calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return first === 0 ? 0 : ((last - first) / first) * 100;
  }

  async getProgressTrends(
    checkIns: CheckInData[],
    metrics: string[],
    timeframe: 'week' | 'month' | 'year'
  ): Promise<TrendData> {
    const periods = this.generatePeriods(timeframe);
    const datasets = metrics.map(metric => ({
      label: metric,
      data: periods.map(period => {
        const periodCheckIns = checkIns.filter(checkIn => {
          const checkInDate = new Date(checkIn.date);
          return checkInDate >= period.start && checkInDate <= period.end;
        });
        
        if (periodCheckIns.length === 0) return null;
        
        // Calculate average for the period
        const values = periodCheckIns
          .map(checkIn => {
            const value = checkIn.measurements?.[metric];
            return typeof value === 'string' ? parseFloat(value) : value;
          })
          .filter(val => !isNaN(val) && val !== null && val !== undefined) as number[];
          
        return values.length > 0 
          ? values.reduce((a, b) => a + b, 0) / values.length 
          : null;
      }),
      trend: 0 // Will be calculated after filtering nulls
    }));

    // Calculate trends and clean up null values
    datasets.forEach(dataset => {
      const validData = dataset.data.filter(val => val !== null) as number[];
      dataset.trend = this.calculateTrend(validData);
      dataset.data = dataset.data.map(val => val ?? 0);
    });

    return {
      labels: periods.map(p => p.label),
      datasets
    };
  }

  async getPerformanceMetrics(checkIns: CheckInData[]): Promise<PerformanceMetrics> {
    // Sort check-ins by date in descending order
    const sortedCheckIns = [...checkIns].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const recentCheckIns = sortedCheckIns.slice(0, 2); // Get last two check-ins
    const categories = ['physical', 'nutrition', 'mental', 'lifestyle'];
    
    const categoryMetrics = categories.reduce((acc, category) => {
      const current = recentCheckIns[0]?.scores?.categories[category]?.percentage ?? 0;
      const previous = recentCheckIns[1]?.scores?.categories[category]?.percentage ?? 0;
      
      // Ensure values are numbers
      const currentNum = typeof current === 'string' ? parseFloat(current) : current;
      const previousNum = typeof previous === 'string' ? parseFloat(previous) : previous;
      
      // Calculate change percentage
      const change = previousNum === 0 
        ? currentNum > 0 ? 100 : 0 
        : ((currentNum - previousNum) / previousNum) * 100;
      
      // Determine trend with more granular thresholds
      let trend: 'up' | 'down' | 'stable';
      if (Math.abs(change) < 1) {
        trend = 'stable';
      } else {
        trend = change > 0 ? 'up' : 'down';
      }
      
      acc[category] = {
        current: currentNum,
        previous: previousNum,
        change,
        trend
      };
      
      return acc;
    }, {} as PerformanceMetrics['categories']);

    // Calculate check-in streak with date validation
    let streak = 0;
    let lastDate: Date | null = null;
    
    for (const checkIn of sortedCheckIns) {
      const currentDate = new Date(checkIn.date);
      
      if (!lastDate) {
        lastDate = currentDate;
        if (checkIn.status === 'completed') streak++;
        continue;
      }

      // Check if dates are consecutive (allowing for weekends)
      const daysDiff = Math.floor(
        (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 3 && checkIn.status === 'completed') {
        streak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const thirtyDayCheckIns = sortedCheckIns.filter(ci => 
      new Date(ci.date) >= thirtyDaysAgo
    );
    
    const completedCheckIns = thirtyDayCheckIns.filter(ci => ci.status === 'completed');
    const completionRate = thirtyDayCheckIns.length > 0
      ? (completedCheckIns.length / thirtyDayCheckIns.length) * 100
      : 0;

    // Calculate consistency score with weighted factors
    const streakWeight = 0.4;
    const completionWeight = 0.4;
    const regularityWeight = 0.2;

    // Calculate regularity (standard deviation of check-in intervals)
    let regularityScore = 0;
    if (thirtyDayCheckIns.length > 1) {
      const intervals = [];
      for (let i = 1; i < thirtyDayCheckIns.length; i++) {
        const current = new Date(thirtyDayCheckIns[i].date);
        const prev = new Date(thirtyDayCheckIns[i - 1].date);
        intervals.push(Math.abs(current.getTime() - prev.getTime()));
      }
      
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      
      // Convert to a 0-100 score (lower std dev = higher score)
      regularityScore = Math.max(0, 100 - (stdDev / (24 * 60 * 60 * 1000)) * 100);
    }

    const consistencyScore = 
      (streak * streakWeight) + 
      (completionRate * completionWeight) + 
      (regularityScore * regularityWeight);

    return {
      overall: recentCheckIns[0]?.scores?.overall ?? 0,
      categories: categoryMetrics,
      checkInStreak: streak,
      completionRate,
      consistencyScore: Math.min(100, Math.max(0, consistencyScore))
    };
  }

  async getEnhancedAnalytics(clientId: string): Promise<EnhancedAnalytics> {
    try {
      // Fetch all relevant data
      const [checkIns, clientData, goals] = await Promise.all([
        this.getClientCheckIns(clientId),
        this.getClientData(clientId),
        this.getClientGoals(clientId)
      ]);

      // Calculate performance metrics
      const performance = await this.getPerformanceMetrics(checkIns);

      // Calculate trends
      const trends = await this.getProgressTrends(checkIns, ['weight', 'chest', 'waist', 'hips'], 'month');

      // Generate insights
      const insights = this.generateInsights(checkIns, performance);

      // Calculate engagement metrics
      const engagement = this.calculateEngagementMetrics(checkIns, clientData);

      // Process goals
      const processedGoals = this.processGoals(goals);

      return {
        performance,
        trends,
        insights,
        engagement,
        goals: processedGoals
      };
    } catch (error) {
      console.error('Error getting enhanced analytics:', error);
      throw new Error('Failed to fetch enhanced analytics');
    }
  }

  private async getClientCheckIns(clientId: string): Promise<CheckInData[]> {
    const checkInsRef = collection(db, this.CHECKINS_COLLECTION);
    const q = query(
      checkInsRef,
      where('clientId', '==', clientId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CheckInData[];
  }

  private async getClientData(clientId: string): Promise<any> {
    const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
    const clientDoc = await getDoc(clientRef);
    return clientDoc.data();
  }

  private async getClientGoals(clientId: string): Promise<any[]> {
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  private generateInsights(checkIns: CheckInData[], performance: PerformanceMetrics) {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: EnhancedAnalytics['insights']['riskFactors'] = [];

    // Analyze category performance
    Object.entries(performance.categories).forEach(([category, metrics]) => {
      if (metrics.trend === 'up' && metrics.change > 10) {
        strengths.push(`Strong improvement in ${category} metrics`);
      } else if (metrics.trend === 'down' && metrics.change < -10) {
        areasForImprovement.push(`Decline in ${category} metrics`);
        recommendations.push(`Focus on ${category} improvement strategies`);
      }
    });

    // Analyze check-in consistency
    if (performance.checkInStreak < 7) {
      riskFactors.push({
        category: 'Engagement',
        severity: 'high',
        description: 'Low check-in consistency may impact progress tracking'
      });
      recommendations.push('Set up daily check-in reminders');
    }

    // Analyze completion rate
    if (performance.completionRate < 70) {
      riskFactors.push({
        category: 'Compliance',
        severity: 'medium',
        description: 'Low completion rate for check-ins'
      });
      recommendations.push('Review and simplify check-in process');
    }

    return {
      strengths,
      areasForImprovement,
      recommendations,
      riskFactors
    };
  }

  private calculateEngagementMetrics(checkIns: CheckInData[], clientData: any) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Calculate check-in rate
    const recentCheckIns = checkIns.filter(ci => new Date(ci.date) >= thirtyDaysAgo);
    const checkInRate = recentCheckIns.length / 30;

    // Calculate average response time
    const responseTimes = checkIns
      .filter(ci => ci.coachFeedback?.timestamp)
      .map(ci => {
        const checkInDate = new Date(ci.date);
        const feedbackDate = ci.coachFeedback.timestamp.toDate();
        return feedbackDate.getTime() - checkInDate.getTime();
      });

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Calculate interaction score
    const interactionScore = this.calculateInteractionScore(checkIns, clientData);

    // Get last interaction
    const lastInteraction = checkIns.length > 0
      ? new Date(checkIns[0].date)
      : new Date();

    return {
      checkInRate,
      responseTime: averageResponseTime,
      interactionScore,
      lastInteraction
    };
  }

  private calculateInteractionScore(checkIns: CheckInData[], clientData: any): number {
    let score = 0;
    const weights = {
      checkInCompletion: 0.4,
      coachFeedback: 0.3,
      clientResponse: 0.3
    };

    // Check-in completion weight
    const completionRate = checkIns.filter(ci => ci.status === 'completed').length / checkIns.length;
    score += completionRate * weights.checkInCompletion;

    // Coach feedback weight
    const feedbackRate = checkIns.filter(ci => ci.coachFeedback).length / checkIns.length;
    score += feedbackRate * weights.coachFeedback;

    // Client response weight
    const responseRate = checkIns.filter(ci => ci.clientResponse).length / checkIns.length;
    score += responseRate * weights.clientResponse;

    return score * 100;
  }

  private processGoals(goals: any[]): EnhancedAnalytics['goals'] {
    const current: EnhancedAnalytics['goals']['current'] = [];
    const completed: EnhancedAnalytics['goals']['completed'] = [];

    goals.forEach(goal => {
      if (goal.status === 'completed') {
        completed.push({
          id: goal.id,
          title: goal.title,
          completionDate: goal.completedAt.toDate(),
          successRate: this.calculateGoalSuccessRate(goal)
        });
      } else {
        current.push({
          id: goal.id,
          title: goal.title,
          progress: this.calculateGoalProgress(goal),
          deadline: goal.deadline.toDate()
        });
      }
    });

    return { current, completed };
  }

  private calculateGoalSuccessRate(goal: any): number {
    // Implementation depends on goal type and tracking method
    return 0; // Placeholder
  }

  private calculateGoalProgress(goal: any): number {
    // Implementation depends on goal type and tracking method
    return 0; // Placeholder
  }
}

export const analyticsService = new AnalyticsService(); 
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { CheckInData } from '@/types/checkIn';
import { Client } from '@/types/client';
import { Goal } from '@/types/goal';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { CacheService } from './cacheService';
import { MonitoringService } from './monitoringService';

interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
}

interface DataExport {
  anonymizedData: {
    checkIns: any[];
    goals: any[];
    questionnaires: any[];
  };
  metadata: {
    version: string;
    timestamp: string;
    quality: DataQualityMetrics;
  };
}

interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffFactor: number;
}

export class DataExportService {
  private static instance: DataExportService;
  private readonly VERSION = '1.0.0';
  private readonly BATCH_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly OPERATION_TIMEOUT = 30 * 1000; // 30 seconds
  private readonly MIN_QUALITY_THRESHOLD = 70; // 70% minimum quality
  private readonly RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    delay: 1000,
    backoffFactor: 2
  };
  private cacheService: CacheService;
  private monitoringService: MonitoringService;

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.monitoringService = MonitoringService.getInstance();
  }

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  private anonymizeData(data: any): any {
    // Remove personally identifiable information
    const { id, clientId, email, ...anonymized } = data;
    return anonymized;
  }

  private calculateDataQuality(data: any[]): DataQualityMetrics {
    if (data.length === 0) {
      return {
        completeness: 0,
        accuracy: 0,
        consistency: 0
      };
    }

    // Calculate completeness (percentage of required fields filled)
    const completeness = this.calculateCompleteness(data);

    // Calculate accuracy (percentage of valid values)
    const accuracy = this.calculateAccuracy(data);

    // Calculate consistency (percentage of consistent data points)
    const consistency = this.calculateConsistency(data);

    return {
      completeness,
      accuracy,
      consistency
    };
  }

  private calculateCompleteness(data: any[]): number {
    const requiredFields = ['date', 'weight', 'measurements'];
    let totalFields = 0;
    let filledFields = 0;

    data.forEach(item => {
      requiredFields.forEach(field => {
        totalFields++;
        if (item[field] !== undefined && item[field] !== null) {
          filledFields++;
        }
      });
    });

    return (filledFields / totalFields) * 100;
  }

  private calculateAccuracy(data: any[]): number {
    let validValues = 0;
    let totalValues = 0;

    data.forEach(item => {
      // Check weight validity
      if (item.weight) {
        totalValues++;
        const weight = parseFloat(item.weight);
        if (!isNaN(weight) && weight > 0 && weight < 500) {
          validValues++;
        }
      }

      // Check measurements validity
      if (item.measurements) {
        Object.values(item.measurements).forEach(value => {
          totalValues++;
          const measurement = parseFloat(value);
          if (!isNaN(measurement) && measurement > 0) {
            validValues++;
          }
        });
      }
    });

    return (validValues / totalValues) * 100;
  }

  private calculateConsistency(data: any[]): number {
    if (data.length < 2) return 100;

    let consistentPoints = 0;
    let totalPoints = 0;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check weight consistency
    for (let i = 1; i < sortedData.length; i++) {
      const prevWeight = parseFloat(sortedData[i - 1].weight);
      const currentWeight = parseFloat(sortedData[i].weight);
      
      if (!isNaN(prevWeight) && !isNaN(currentWeight)) {
        totalPoints++;
        const weightDiff = Math.abs(currentWeight - prevWeight);
        if (weightDiff <= 10) { // Allow 10kg difference between consecutive check-ins
          consistentPoints++;
        }
      }
    }

    return (consistentPoints / totalPoints) * 100;
  }

  private async withTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = config.delay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === config.maxAttempts) break;

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= config.backoffFactor;
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  private validateDataQuality(quality: DataQualityMetrics): boolean {
    return (
      quality.completeness >= this.MIN_QUALITY_THRESHOLD &&
      quality.accuracy >= this.MIN_QUALITY_THRESHOLD &&
      quality.consistency >= this.MIN_QUALITY_THRESHOLD
    );
  }

  async exportDataForAI(clientId: string): Promise<DataExport> {
    const startTime = Date.now();
    try {
      // Check cache first
      const cacheKey = CacheService.generateKey('ai_export', { clientId });
      const cachedData = this.cacheService.get<DataExport>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch all relevant data in parallel with batching and timeout
      const [checkIns, goals, questionnaires] = await Promise.all([
        this.withTimeout(() => this.fetchCheckInsWithBatching(clientId), this.OPERATION_TIMEOUT),
        this.withTimeout(() => this.fetchGoalsWithBatching(clientId), this.OPERATION_TIMEOUT),
        this.withTimeout(() => this.fetchQuestionnairesWithBatching(clientId), this.OPERATION_TIMEOUT)
      ]);

      // Anonymize data
      const anonymizedData = {
        checkIns: checkIns.map(this.anonymizeData),
        goals: goals.map(this.anonymizeData),
        questionnaires: questionnaires.map(this.anonymizeData)
      };

      // Calculate data quality
      const quality = this.calculateDataQuality(checkIns);

      // Validate data quality
      if (!this.validateDataQuality(quality)) {
        throw new Error('Data quality below minimum threshold');
      }

      const result: DataExport = {
        anonymizedData,
        metadata: {
          version: this.VERSION,
          timestamp: new Date().toISOString(),
          quality
        }
      };

      // Cache the result
      this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Track performance
      const endTime = Date.now();
      await this.monitoringService.trackPerformance({
        responseTime: endTime - startTime,
        dataSize: JSON.stringify(result).length,
        cacheHitRate: 0, // Cache miss in this case
        errorRate: 0,
        endpoint: 'exportDataForAI',
        userId: clientId
      });

      return result;
    } catch (error) {
      console.error('Error exporting data for AI:', error);
      
      // Track error
      await this.monitoringService.trackPerformance({
        responseTime: Date.now() - startTime,
        dataSize: 0,
        cacheHitRate: 0,
        errorRate: 1,
        endpoint: 'exportDataForAI',
        userId: clientId
      });

      throw new Error('Failed to export data for AI training');
    }
  }

  private async fetchCheckInsWithBatching(clientId: string): Promise<CheckInData[]> {
    return this.withRetry(async () => {
      const checkInsRef = collection(db, 'checkIns');
      let lastDoc = null;
      let allCheckIns: CheckInData[] = [];

      while (true) {
        let q = query(
          checkInsRef,
          where('clientId', '==', clientId),
          orderBy('date', 'desc'),
          limit(this.BATCH_SIZE)
        );

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        const batchCheckIns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CheckInData));

        allCheckIns = [...allCheckIns, ...batchCheckIns];
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.docs.length < this.BATCH_SIZE) break;
      }

      return allCheckIns;
    });
  }

  private async fetchGoalsWithBatching(clientId: string): Promise<Goal[]> {
    return this.withRetry(async () => {
      const goalsRef = collection(db, 'goals');
      let lastDoc = null;
      let allGoals: Goal[] = [];

      while (true) {
        let q = query(
          goalsRef,
          where('clientId', '==', clientId),
          orderBy('createdAt', 'desc'),
          limit(this.BATCH_SIZE)
        );

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        const batchGoals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Goal));

        allGoals = [...allGoals, ...batchGoals];
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.docs.length < this.BATCH_SIZE) break;
      }

      return allGoals;
    });
  }

  private async fetchQuestionnairesWithBatching(clientId: string): Promise<QuestionnaireResponse[]> {
    return this.withRetry(async () => {
      const questionnairesRef = collection(db, 'questionnaires');
      let lastDoc = null;
      let allQuestionnaires: QuestionnaireResponse[] = [];

      while (true) {
        let q = query(
          questionnairesRef,
          where('clientId', '==', clientId),
          orderBy('submittedAt', 'desc'),
          limit(this.BATCH_SIZE)
        );

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        const batchQuestionnaires = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as QuestionnaireResponse));

        allQuestionnaires = [...allQuestionnaires, ...batchQuestionnaires];
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.docs.length < this.BATCH_SIZE) break;
      }

      return allQuestionnaires;
    });
  }
} 
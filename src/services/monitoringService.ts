import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, startAfter, writeBatch } from 'firebase/firestore';
import { CacheService } from './cacheService';

interface PerformanceMetrics {
  responseTime: number;
  dataSize: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: string;
  endpoint: string;
  userId: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  size: number;
}

interface PerformanceSummary {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  averageDataSize: number;
  cacheHitRate: number;
}

interface MetricValidation {
  minResponseTime: number;
  maxResponseTime: number;
  minDataSize: number;
  maxDataSize: number;
  minCacheHitRate: number;
  maxCacheHitRate: number;
  minErrorRate: number;
  maxErrorRate: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private cacheMetrics: Map<string, CacheMetrics>;
  private readonly COLLECTION_NAME = 'performanceMetrics';
  private readonly MAX_METRICS = 1000;
  private readonly BATCH_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_BATCH_SIZE = 500;
  private readonly METRIC_VALIDATION: MetricValidation = {
    minResponseTime: 0,
    maxResponseTime: 60 * 1000, // 1 minute
    minDataSize: 0,
    maxDataSize: 10 * 1024 * 1024, // 10MB
    minCacheHitRate: 0,
    maxCacheHitRate: 100,
    minErrorRate: 0,
    maxErrorRate: 100
  };
  private cacheService: CacheService;
  private metricBatch: PerformanceMetrics[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.cacheMetrics = new Map();
    this.cacheService = CacheService.getInstance();
    this.startBatchProcessing();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private validateMetrics(metrics: PerformanceMetrics): boolean {
    return (
      metrics.responseTime >= this.METRIC_VALIDATION.minResponseTime &&
      metrics.responseTime <= this.METRIC_VALIDATION.maxResponseTime &&
      metrics.dataSize >= this.METRIC_VALIDATION.minDataSize &&
      metrics.dataSize <= this.METRIC_VALIDATION.maxDataSize &&
      metrics.cacheHitRate >= this.METRIC_VALIDATION.minCacheHitRate &&
      metrics.cacheHitRate <= this.METRIC_VALIDATION.maxCacheHitRate &&
      metrics.errorRate >= this.METRIC_VALIDATION.minErrorRate &&
      metrics.errorRate <= this.METRIC_VALIDATION.maxErrorRate
    );
  }

  private startBatchProcessing(): void {
    this.batchTimeout = setInterval(() => {
      this.processBatch();
    }, 5000); // Process batch every 5 seconds
  }

  private async processBatch(): Promise<void> {
    if (this.metricBatch.length === 0) return;

    try {
      const batch = writeBatch(db);
      const metricsRef = collection(db, this.COLLECTION_NAME);

      // Process metrics in chunks of MAX_BATCH_SIZE
      for (let i = 0; i < this.metricBatch.length; i += this.MAX_BATCH_SIZE) {
        const chunk = this.metricBatch.slice(i, i + this.MAX_BATCH_SIZE);
        
        chunk.forEach(metric => {
          const docRef = metricsRef.doc();
          batch.set(docRef, metric);
        });

        await batch.commit();
      }

      // Clear processed metrics
      this.metricBatch = [];
    } catch (error) {
      console.error('Error processing metric batch:', error);
      // Attempt recovery
      await this.recoverFromError('processBatch');
    }
  }

  async trackPerformance(metrics: Omit<PerformanceMetrics, 'timestamp'>): Promise<void> {
    try {
      const fullMetrics: PerformanceMetrics = {
        ...metrics,
        timestamp: new Date().toISOString()
      };

      // Validate metrics
      if (!this.validateMetrics(fullMetrics)) {
        console.warn('Invalid metrics detected:', fullMetrics);
        return;
      }

      // Add to batch
      this.metricBatch.push(fullMetrics);

      // Process batch if it reaches MAX_BATCH_SIZE
      if (this.metricBatch.length >= this.MAX_BATCH_SIZE) {
        await this.processBatch();
      }

      // Clean up old metrics if needed
      await this.cleanupOldMetrics();
    } catch (error) {
      console.error('Error tracking performance metrics:', error);
      // Attempt recovery
      await this.recoverFromError('trackPerformance');
    }
  }

  private async recoverFromError(operation: string): Promise<void> {
    try {
      switch (operation) {
        case 'processBatch':
          // Clear the batch and try again
          this.metricBatch = [];
          await this.processBatch();
          break;
        case 'trackPerformance':
          // Log the error and continue
          console.error('Recovery from trackPerformance error');
          break;
        default:
          console.error(`Unknown recovery operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Error during recovery from ${operation}:`, error);
    }
  }

  async getPerformanceMetrics(
    userId: string,
    endpoint: string,
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): Promise<PerformanceMetrics[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.generateKey('performance_metrics', { userId, endpoint, timeRange });
      const cachedMetrics = this.cacheService.get<PerformanceMetrics[]>(cacheKey);
      if (cachedMetrics) {
        return cachedMetrics;
      }

      const metricsRef = collection(db, this.COLLECTION_NAME);
      const timeFilter = this.getTimeFilter(timeRange);
      
      let allMetrics: PerformanceMetrics[] = [];
      let lastDoc = null;

      while (true) {
        let q = query(
          metricsRef,
          where('userId', '==', userId),
          where('endpoint', '==', endpoint),
          where('timestamp', '>=', timeFilter),
          orderBy('timestamp', 'desc'),
          limit(this.BATCH_SIZE)
        );

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        const batchMetrics = snapshot.docs.map(doc => doc.data() as PerformanceMetrics);
        allMetrics = [...allMetrics, ...batchMetrics];
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.docs.length < this.BATCH_SIZE) break;
      }

      // Cache the results
      this.cacheService.set(cacheKey, allMetrics, this.CACHE_TTL);

      return allMetrics;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  trackCacheMetrics(cacheKey: string, hit: boolean, size: number): void {
    try {
      const metrics = this.cacheMetrics.get(cacheKey) || {
        hits: 0,
        misses: 0,
        size: 0
      };

      if (hit) {
        metrics.hits++;
      } else {
        metrics.misses++;
      }
      metrics.size = size;

      this.cacheMetrics.set(cacheKey, metrics);
    } catch (error) {
      console.error('Error tracking cache metrics:', error);
    }
  }

  getCacheMetrics(cacheKey: string): CacheMetrics | undefined {
    return this.cacheMetrics.get(cacheKey);
  }

  getCacheHitRate(cacheKey: string): number {
    try {
      const metrics = this.cacheMetrics.get(cacheKey);
      if (!metrics) return 0;

      const total = metrics.hits + metrics.misses;
      return total === 0 ? 0 : (metrics.hits / total) * 100;
    } catch (error) {
      console.error('Error calculating cache hit rate:', error);
      return 0;
    }
  }

  private getTimeFilter(timeRange: 'day' | 'week' | 'month'): string {
    const now = new Date();
    let filterDate: Date;

    switch (timeRange) {
      case 'day':
        filterDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        filterDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        filterDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        filterDate = new Date(now.setDate(now.getDate() - 1));
    }

    return filterDate.toISOString();
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const metricsRef = collection(db, this.COLLECTION_NAME);
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 1); // Keep last month's data

      let lastDoc = null;
      while (true) {
        let q = query(
          metricsRef,
          where('timestamp', '<', oldDate.toISOString()),
          orderBy('timestamp', 'desc'),
          limit(this.BATCH_SIZE)
        );

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.docs.length < this.BATCH_SIZE) break;
      }
    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
    }
  }

  async getPerformanceSummary(
    userId: string,
    endpoint: string,
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): Promise<PerformanceSummary> {
    try {
      // Check cache first
      const cacheKey = CacheService.generateKey('performance_summary', { userId, endpoint, timeRange });
      const cachedSummary = this.cacheService.get<PerformanceSummary>(cacheKey);
      if (cachedSummary) {
        return cachedSummary;
      }

      const metrics = await this.getPerformanceMetrics(userId, endpoint, timeRange);
      
      if (metrics.length === 0) {
        return {
          averageResponseTime: 0,
          totalRequests: 0,
          errorRate: 0,
          averageDataSize: 0,
          cacheHitRate: 0
        };
      }

      const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
      const totalDataSize = metrics.reduce((sum, m) => sum + m.dataSize, 0);
      const totalErrors = metrics.reduce((sum, m) => sum + m.errorRate, 0);
      const totalCacheHits = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0);

      const summary: PerformanceSummary = {
        averageResponseTime: totalResponseTime / metrics.length,
        totalRequests: metrics.length,
        errorRate: totalErrors / metrics.length,
        averageDataSize: totalDataSize / metrics.length,
        cacheHitRate: totalCacheHits / metrics.length
      };

      // Cache the summary
      this.cacheService.set(cacheKey, summary, this.CACHE_TTL);

      return summary;
    } catch (error) {
      console.error('Error getting performance summary:', error);
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        averageDataSize: 0,
        cacheHitRate: 0
      };
    }
  }

  destroy(): void {
    if (this.batchTimeout) {
      clearInterval(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.metricBatch = [];
  }
} 
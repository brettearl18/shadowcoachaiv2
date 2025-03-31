import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import crypto from 'crypto';

interface SecurityConfig {
  encryptionKey: string;
  rateLimit: number;
  accessLevel: string;
  userId: string;
}

interface AccessLog {
  timestamp: string;
  userId: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  reason?: string;
}

interface RateLimit {
  count: number;
  timestamp: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private readonly COLLECTION_NAME = 'accessLogs';
  private readonly RATE_LIMIT_COLLECTION = 'rateLimits';
  private readonly MAX_LOGS = 1000;
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  private constructor() {}

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  async secureAIEndpoint(config: SecurityConfig): Promise<boolean> {
    try {
      // Check rate limit
      const isRateLimited = await this.checkRateLimit(config.userId);
      if (isRateLimited) {
        await this.logAccess({
          ...config,
          status: 'failed',
          reason: 'Rate limit exceeded'
        });
        return false;
      }

      // Check access level
      const hasAccess = await this.checkAccessLevel(config.userId, config.accessLevel);
      if (!hasAccess) {
        await this.logAccess({
          ...config,
          status: 'failed',
          reason: 'Insufficient access level'
        });
        return false;
      }

      // Log successful access
      await this.logAccess({
        ...config,
        status: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error securing AI endpoint:', error);
      return false;
    }
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW);

      const rateLimitRef = collection(db, this.RATE_LIMIT_COLLECTION);
      const q = query(
        rateLimitRef,
        where('userId', '==', userId),
        where('timestamp', '>=', windowStart.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const recentRequests = snapshot.docs.length;

      // Add new rate limit entry
      await addDoc(rateLimitRef, {
        userId,
        timestamp: now.toISOString(),
        count: 1
      });

      // Clean up old rate limit entries
      await this.cleanupRateLimits();

      return recentRequests >= 100; // Max 100 requests per hour
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return true; // Fail safe: block if we can't check rate limit
    }
  }

  private async checkAccessLevel(userId: string, requiredLevel: string): Promise<boolean> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        return false;
      }

      // Get user's custom claims
      const idTokenResult = await user.getIdTokenResult();
      const userAccessLevel = idTokenResult.claims.accessLevel as string;

      // Define access level hierarchy
      const accessLevels = ['basic', 'premium', 'admin'];
      const userLevelIndex = accessLevels.indexOf(userAccessLevel);
      const requiredLevelIndex = accessLevels.indexOf(requiredLevel);

      return userLevelIndex >= requiredLevelIndex;
    } catch (error) {
      console.error('Error checking access level:', error);
      return false;
    }
  }

  private async logAccess(log: Omit<AccessLog, 'timestamp'>): Promise<void> {
    try {
      const accessLog: AccessLog = {
        ...log,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, this.COLLECTION_NAME), accessLog);
      await this.cleanupOldLogs();
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const logsRef = collection(db, this.COLLECTION_NAME);
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 1); // Keep last month's logs

      const q = query(
        logsRef,
        where('timestamp', '<', oldDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const batch = db.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  private async cleanupRateLimits(): Promise<void> {
    try {
      const rateLimitRef = collection(db, this.RATE_LIMIT_COLLECTION);
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 1); // Keep last hour's rate limits

      const q = query(
        rateLimitRef,
        where('timestamp', '<', oldDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const batch = db.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up rate limits:', error);
    }
  }

  async getAccessLogs(
    userId: string,
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): Promise<AccessLog[]> {
    try {
      const logsRef = collection(db, this.COLLECTION_NAME);
      const timeFilter = this.getTimeFilter(timeRange);
      
      const q = query(
        logsRef,
        where('userId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(this.MAX_LOGS)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AccessLog);
    } catch (error) {
      console.error('Error fetching access logs:', error);
      return [];
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

  generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  encryptData(data: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  decryptData(encryptedData: string, key: string): string {
    const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
} 
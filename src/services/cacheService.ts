interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  private constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (this.isDestroyed) return;
    
    try {
      // Check cache size and remove oldest items if needed
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        this.removeOldestItems();
      }

      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    } catch (error) {
      console.error('Error setting cache item:', error);
      // Attempt recovery
      this.recoverFromError('set', key);
    }
  }

  get<T>(key: string): T | null {
    if (this.isDestroyed) return null;

    try {
      const item = this.cache.get(key);
      if (!item) return null;

      // Check if item is expired
      if (this.isExpired(item)) {
        this.cache.delete(key);
        return null;
      }

      return item.data as T;
    } catch (error) {
      console.error('Error getting cache item:', error);
      // Attempt recovery
      return this.recoverFromError('get', key);
    }
  }

  delete(key: string): void {
    if (this.isDestroyed) return;

    try {
      this.cache.delete(key);
    } catch (error) {
      console.error('Error deleting cache item:', error);
      // Attempt recovery
      this.recoverFromError('delete', key);
    }
  }

  clear(): void {
    if (this.isDestroyed) return;

    try {
      this.cache.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Attempt recovery
      this.recoverFromError('clear');
    }
  }

  destroy(): void {
    if (this.isDestroyed) return;

    try {
      this.isDestroyed = true;
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      this.cache.clear();
    } catch (error) {
      console.error('Error destroying cache service:', error);
    }
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private removeOldestItems(): void {
    if (this.isDestroyed) return;

    try {
      // Use a lock to prevent concurrent modifications
      const lock = this.acquireLock();
      if (!lock) return;

      try {
        const sortedItems = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp);

        // Remove 20% of oldest items
        const itemsToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
        sortedItems.slice(0, itemsToRemove).forEach(([key]) => {
          this.cache.delete(key);
        });
      } finally {
        this.releaseLock();
      }
    } catch (error) {
      console.error('Error removing oldest items:', error);
      // Attempt recovery
      this.recoverFromError('removeOldestItems');
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      if (!this.isDestroyed) {
        this.cleanup();
      }
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    if (this.isDestroyed) return;

    try {
      for (const [key, item] of this.cache.entries()) {
        if (this.isExpired(item)) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      // Attempt recovery
      this.recoverFromError('cleanup');
    }
  }

  getCacheStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    if (this.isDestroyed) {
      return {
        size: 0,
        keys: [],
        memoryUsage: 0
      };
    }

    try {
      const keys = Array.from(this.cache.keys());
      const memoryUsage = this.estimateMemoryUsage();

      return {
        size: this.cache.size,
        keys,
        memoryUsage
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        size: 0,
        keys: [],
        memoryUsage: 0
      };
    }
  }

  private estimateMemoryUsage(): number {
    try {
      let totalSize = 0;
      for (const [, item] of this.cache) {
        totalSize += JSON.stringify(item).length * 2; // Approximate size in bytes
      }
      return totalSize;
    } catch (error) {
      console.error('Error estimating memory usage:', error);
      return 0;
    }
  }

  private recoverFromError(operation: string, key?: string): any {
    try {
      switch (operation) {
        case 'set':
          // Attempt to clear the cache and retry the operation
          this.cache.clear();
          return null;
        case 'get':
          // Return null for failed get operations
          return null;
        case 'delete':
          // Attempt to remove the key if it exists
          if (key) this.cache.delete(key);
          return;
        case 'clear':
          // Attempt to clear the cache
          this.cache.clear();
          return;
        case 'removeOldestItems':
          // Attempt to clear the cache
          this.cache.clear();
          return;
        case 'cleanup':
          // Attempt to clear expired items
          this.cleanup();
          return;
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error during recovery from ${operation}:`, error);
      return null;
    }
  }

  private lock: boolean = false;

  private acquireLock(): boolean {
    if (this.lock) return false;
    this.lock = true;
    return true;
  }

  private releaseLock(): void {
    this.lock = false;
  }

  static generateKey(prefix: string, params: Record<string, any>): string {
    try {
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = params[key];
          return acc;
        }, {} as Record<string, any>);

      return `${prefix}:${JSON.stringify(sortedParams)}`;
    } catch (error) {
      console.error('Error generating cache key:', error);
      return prefix;
    }
  }
}

// Export a singleton instance
export const cacheService = CacheService.getInstance(); 
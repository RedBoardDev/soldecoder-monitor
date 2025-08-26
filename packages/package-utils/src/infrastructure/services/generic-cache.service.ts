import { CacheSerializationError } from '@package-utils/domain/errors/cache.errors';
import type { IGenericCacheService } from '@package-utils/domain/interfaces/generic-cache.service.interface';
import type { CacheEntry, CacheStats } from '@package-utils/domain/types/cache.types';
import { logger } from '@soldecoder-monitor/logger';

/**
 * Generic cache service implementation.
 * Optimized for Discord bots with automatic cleanup and memory safety.
 */
export class GenericCacheService implements IGenericCacheService {
  private static instance: GenericCacheService;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;
  private readonly maxKeys: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private hitCount = 0;
  private missCount = 0;

  constructor(
    defaultTtlMs: number = 30 * 60 * 1000, // 30 minutes
    maxKeys: number = 10000,
    autoCleanupIntervalMs: number = 5 * 60 * 1000,
  ) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxKeys = maxKeys;

    // Auto-cleanup to prevent memory leaks
    if (autoCleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup().catch((err) => logger.error('[CACHE] Auto cleanup failed', err));
      }, autoCleanupIntervalMs);
    }

    logger.info('[CACHE] Service initialized', {
      defaultTtlMs,
      maxKeys,
      autoCleanup: autoCleanupIntervalMs > 0,
    });
  }

  /**
   * Get singleton instance with default configuration.
   */
  static getInstance(): GenericCacheService {
    if (!GenericCacheService.instance) {
      GenericCacheService.instance = new GenericCacheService();
    }
    return GenericCacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if the entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.missCount++;
      logger.debug('[CACHE] Entry expired', { key });
      return null;
    }

    this.hitCount++;

    // Clone to prevent mutations (basic protection)
    try {
      return this.cloneData(entry.data) as T;
    } catch (_error) {
      logger.warn('[CACHE] Failed to clone data, returning original', { key });
      return entry.data as T;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    // Check the key limit
    if (!this.cache.has(key) && this.cache.size >= this.maxKeys) {
      // Simple strategy: remove expired entries first
      const _cleaned = await this.cleanup();

      // If still too many keys after cleanup, remove the oldest
      if (this.cache.size >= this.maxKeys) {
        const oldestKey = this.findOldestKey();
        if (oldestKey) {
          this.cache.delete(oldestKey);
          logger.debug('[CACHE] Evicted oldest entry', { key: oldestKey });
        }
      }
    }

    const effectiveTtl = ttlMs ?? this.defaultTtlMs;

    // Clone to prevent external mutations
    let dataToStore: T;
    try {
      dataToStore = this.cloneData(value) as T;
    } catch (_error) {
      logger.warn('[CACHE] Failed to clone data, storing original', { key });
      dataToStore = value;
    }

    this.cache.set(key, {
      data: dataToStore,
      timestamp: Date.now(),
      ttl: effectiveTtl,
    });

    logger.debug('[CACHE] Entry set', {
      key,
      ttl: effectiveTtl,
      cacheSize: this.cache.size,
    });
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.cache.delete(key);
    if (existed) {
      logger.debug('[CACHE] Entry deleted', { key });
    }
    return existed;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    logger.info('[CACHE] Cache cleared', { previousSize });
  }

  getStats(): CacheStats {
    let expiredKeys = 0;
    let oldestTimestamp = Date.now();
    const now = Date.now();

    for (const [_, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys++;
      }
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    return {
      totalKeys: this.cache.size,
      expiredKeys,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestEntryAge: this.cache.size > 0 ? now - oldestTimestamp : undefined,
    };
  }

  async cleanup(): Promise<number> {
    const before = this.cache.size;
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('[CACHE] Cleanup completed', {
        before,
        after: this.cache.size,
        cleaned: cleanedCount,
      });
    }

    return cleanedCount;
  }

  /**
   * Destroy the service and cleanup resources.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    logger.info('[CACHE] Service destroyed');
  }

  /**
   * Check if the cache entry is expired.
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Find the oldest cache key (simple FIFO eviction).
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clone data to prevent external mutations.
   * Simple clone for JSON-serializable data.
   */
  private cloneData<T>(data: T): T {
    // Primitive types do not need to be cloned
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    // Attempt a simple clone via JSON (sufficient for 99% of cases)
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      // If it fails (circular refs, functions, etc), throw a serialization error
      throw new CacheSerializationError(`Failed to clone data: ${error}`);
    }
  }
}

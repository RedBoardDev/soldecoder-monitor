import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { IGenericCacheService } from './cache.interface';

const logger = createFeatureLogger('GENERIC_CACHE');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Generic cache service implementation.
 * Domain-agnostic key-value storage with TTL support.
 */
export class GenericCacheService implements IGenericCacheService {
  private static instance: GenericCacheService;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(defaultTtlMs: number = 30 * 60 * 1000) {
    // 30 minutes default
    this.defaultTtlMs = defaultTtlMs;
    logger.debug('Service initialized', { defaultTtlMs });
  }

  /**
   * Get singleton instance with default TTL.
   */
  static getInstance(defaultTtlMs?: number): GenericCacheService {
    if (!GenericCacheService.instance) {
      GenericCacheService.instance = new GenericCacheService(defaultTtlMs);
    }
    return GenericCacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.missCount++;
      logger.debug('Cache expired', { key, age: Date.now() - entry.timestamp });
      return null;
    }

    this.hitCount++;
    logger.debug('Cache hit', { key });
    return entry.data as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: effectiveTtl,
    });

    logger.debug('Cache set', {
       key,
       ttl: effectiveTtl,
       cacheSize: this.cache.size,
     });
  }

  delete(key: string): void {
    const existed = this.cache.delete(key);

    if (existed) {
      logger.debug('Cache delete', { key });
    }
  }

  has(key: string): boolean {
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

  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    logger.info('Cache cleared', { previousSize });
  }

  getStats(): { totalKeys: number; expiredKeys: number; hitRate?: number } {
    let expiredKeys = 0;
    const now = Date.now();

    // Count expired keys without removing them
    for (const [_, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys++;
      }
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : undefined;

    return {
      totalKeys: this.cache.size,
      expiredKeys,
      hitRate: hitRate ? Math.round(hitRate * 100) / 100 : undefined,
    };
  }

  cleanup(): void {
    const before = this.cache.size;
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cleanup completed', {
        before,
        after: this.cache.size,
        cleaned: cleanedCount,
      });
    }
  }

  /**
   * Checks if a cache entry is expired.
   * @param entry The cache entry to check
   * @returns True if expired, false otherwise
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

import type { CacheStats } from '@package-utils/domain/types/cache.types';

/**
 * Generic cache service interface for key-value storage with TTL support.
 * Simple and efficient for small to medium Discord bots.
 */
export interface IGenericCacheService {
  /**
   * Retrieves a value from cache by key.
   * @param key The cache key
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value in cache with optional TTL.
   * @param key The cache key
   * @param value The value to store
   * @param ttlMs Optional TTL in milliseconds
   */
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;

  /**
   * Removes a value from cache.
   * @param key The cache key to remove
   * @returns True if the key existed and was removed
   */
  delete(key: string): Promise<boolean>;

  /**
   * Checks if a key exists in cache and is not expired.
   * @param key The cache key to check
   */
  has(key: string): Promise<boolean>;

  /**
   * Clears all cache entries.
   */
  clear(): Promise<void>;

  /**
   * Returns cache statistics.
   */
  getStats(): CacheStats;

  /**
   * Manually triggers cleanup of expired entries.
   * Returns the number of cleaned entries.
   */
  cleanup(): Promise<number>;
}

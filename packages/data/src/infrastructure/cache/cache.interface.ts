/**
 * Generic cache service interface for key-value storage with TTL support.
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
   * @param ttlMs Optional TTL in milliseconds (uses default if not provided)
   */
  set<T>(key: string, value: T, ttlMs?: number): void;

  /**
   * Removes a value from cache.
   * @param key The cache key to remove
   */
  delete(key: string): void;

  /**
   * Checks if a key exists in cache and is not expired.
   * @param key The cache key to check
   * @returns True if key exists and is valid, false otherwise
   */
  has(key: string): boolean;

  /**
   * Clears all cache entries.
   */
  clear(): void;

  /**
   * Returns cache statistics.
   */
  getStats(): {
    totalKeys: number;
    expiredKeys: number;
    hitRate?: number;
  };

  /**
   * Manually triggers cleanup of expired entries.
   */
  cleanup(): void;
}

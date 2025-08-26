import type { IGenericCacheService } from '@package-utils/domain/interfaces/generic-cache.service.interface';
import type { CacheStats } from '@package-utils/domain/types/cache.types';

/**
 * Base interface for cached repositories.
 * Provides methods for caching and database operations.
 */
export interface ICachedRepositoryBase {
  readonly cache: IGenericCacheService;
  readonly databaseService: <T>(query: string, params?: T[]) => Promise<T[]>;
  readonly defaultTtlMs: number;

  /**
   * Generic cached get operation.
   * Tries cache first, falls back to database, then caches the result.
   */
  cachedGet<T>(
    cacheKey: string,
    databaseFetcher: () => Promise<T | null>,
    logContext?: Record<string, unknown>,
  ): Promise<T | null>;

  /**
   * Generic cached save operation.
   * Saves to the database first, then updates the cache.
   */
  cachedSave<T>(
    cacheKey: string,
    entity: T,
    databaseSaver: (entity: T) => Promise<void>,
    logContext?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Generic cached delete operation.
   * Deletes from the database first, then removes from the cache.
   */
  cachedDelete(
    cacheKey: string,
    databaseDeleter: () => Promise<void>,
    logContext?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Generic batch cache operation.
   * Useful for caching multiple items at once (such as getAll operations).
   */
  cacheMultiple<T>(items: T[], keyExtractor: (item: T) => string, logContext?: Record<string, unknown>): Promise<void>;

  /**
   * Updates a cache list (such as a list of guild channels).
   * Handles add/remove operations on cached arrays.
   */
  updateCacheList(listCacheKey: string, itemToAddOrRemove: string, operation: 'add' | 'remove'): Promise<void>;

  /**
   * Invalidate cache for a specific key.
   * Useful when you want to force a refresh from the database.
   */
  invalidateCache(cacheKey: string): Promise<void>;

  /**
   * Invalidate cache for multiple keys.
   * Useful when you want to force a refresh from the database.
   */
  invalidateMultiple(cacheKeys: string[]): Promise<void>;

  /**
   * Check if an item exists in cache without fetching from the database.
   * Useful for quick existence checks.
   */
  existsInCache(cacheKey: string): Promise<boolean>;

  /**
   * Returns cache statistics.
   */
  getCacheStats(): CacheStats;
}

import type { ICachedRepositoryBase } from '@package-utils/domain/interfaces/cached-repository.interface';
import type { IGenericCacheService } from '@package-utils/domain/interfaces/generic-cache.service.interface';
import { GenericCacheService } from '@package-utils/infrastructure/services/generic-cache.service';
import { logger } from '@soldecoder-monitor/logger';

/**
 * Base class for repositories that automatically handles cache/database operations.
 * Eliminates repetitive get cache → get database → save cache patterns.
 */
export abstract class CachedRepositoryBase implements ICachedRepositoryBase {
  public readonly cache: IGenericCacheService;
  public readonly databaseService: <T>(query: string, params?: T[]) => Promise<T[]>;
  public readonly defaultTtlMs = 30 * 60 * 1000; // 30 minutes

  constructor(databaseService: <T>(query: string, params?: T[]) => Promise<T[]>) {
    this.cache = GenericCacheService.getInstance();
    this.databaseService = databaseService;
  }

  /**
   * Generic cached get operation.
   * Tries cache first, falls back to database, then caches the result.
   */
  async cachedGet<T>(
    cacheKey: string,
    databaseFetcher: () => Promise<T | null>,
    logContext: Record<string, unknown> = {},
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) {
      logger.debug('[CACHED_REPO] Found in cache', { cacheKey, ...logContext });
      return cached;
    }

    // If not in cache, fetch from database
    logger.debug('[CACHED_REPO] Cache miss, loading from DB', { cacheKey, ...logContext });
    const result = await databaseFetcher();

    if (result) {
      // Cache the result - set() is now async
      await this.cache.set(cacheKey, result, this.defaultTtlMs);
      logger.debug('[CACHED_REPO] Loaded from DB and cached', { cacheKey, ...logContext });
    }

    return result;
  }

  /**
   * Generic cached save operation.
   * Saves to the database first, then updates the cache.
   */
  async cachedSave<T>(
    cacheKey: string,
    entity: T,
    databaseSaver: (entity: T) => Promise<void>,
    logContext: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      // Save to the database first
      await databaseSaver(entity);

      // Then update the cache - set() is now async
      await this.cache.set(cacheKey, entity, this.defaultTtlMs);

      logger.debug('[CACHED_REPO] Saved to DB and cache', { cacheKey, ...logContext });
    } catch (error) {
      logger.error('[CACHED_REPO] Failed to save', error as Error, { cacheKey, ...logContext });
      throw error;
    }
  }

  /**
   * Generic cached delete operation.
   * Deletes from the database first, then removes from the cache.
   */
  async cachedDelete(
    cacheKey: string,
    databaseDeleter: () => Promise<void>,
    logContext: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      // Delete from the database first
      await databaseDeleter();

      // Then remove from the cache - delete() is now async and returns a boolean
      await this.cache.delete(cacheKey);

      logger.debug('[CACHED_REPO] Deleted from DB and cache', { cacheKey, ...logContext });
    } catch (error) {
      logger.error('[CACHED_REPO] Failed to delete', error as Error, { cacheKey, ...logContext });
      throw error;
    }
  }

  /**
   * Generic batch cache operation.
   * Useful for caching multiple items at once (such as getAll operations).
   */
  async cacheMultiple<T>(
    items: T[],
    keyExtractor: (item: T) => string,
    logContext: Record<string, unknown> = {},
  ): Promise<void> {
    // Use Promise.all to parallelize async set operations
    await Promise.all(
      items.map((item) => {
        const cacheKey = keyExtractor(item);
        return this.cache.set(cacheKey, item, this.defaultTtlMs);
      }),
    );

    logger.debug('[CACHED_REPO] Cached multiple items', {
      count: items.length,
      ...logContext,
    });
  }

  /**
   * Updates a cache list (such as a list of guild channels).
   * Handles add/remove operations on cached arrays.
   */
  async updateCacheList(listCacheKey: string, itemToAddOrRemove: string, operation: 'add' | 'remove'): Promise<void> {
    const currentList = (await this.cache.get<string[]>(listCacheKey)) || [];

    if (operation === 'add') {
      if (!currentList.includes(itemToAddOrRemove)) {
        currentList.push(itemToAddOrRemove);
        await this.cache.set(listCacheKey, currentList, this.defaultTtlMs);
        logger.debug('[CACHED_REPO] Added item to cached list', {
          key: listCacheKey,
          item: itemToAddOrRemove,
        });
      }
    } else if (operation === 'remove') {
      const index = currentList.indexOf(itemToAddOrRemove);
      if (index > -1) {
        currentList.splice(index, 1);
        if (currentList.length === 0) {
          await this.cache.delete(listCacheKey);
          logger.debug('[CACHED_REPO] Deleted empty cached list', {
            key: listCacheKey,
          });
        } else {
          await this.cache.set(listCacheKey, currentList, this.defaultTtlMs);
          logger.debug('[CACHED_REPO] Removed item from cached list', {
            key: listCacheKey,
            item: itemToAddOrRemove,
          });
        }
      }
    }
  }

  /**
   * Invalidate cache for a specific key.
   * Useful when you want to force a refresh from the database.
   */
  async invalidateCache(cacheKey: string): Promise<void> {
    const deleted = await this.cache.delete(cacheKey);
    if (deleted) {
      logger.debug('[CACHED_REPO] Cache invalidated', { cacheKey });
    }
  }

  /**
   * Invalidate multiple cache entries at once.
   * Useful for batch invalidation scenarios.
   */
  async invalidateMultiple(cacheKeys: string[]): Promise<void> {
    await Promise.all(cacheKeys.map((key) => this.cache.delete(key)));
    logger.debug('[CACHED_REPO] Multiple cache entries invalidated', {
      count: cacheKeys.length,
    });
  }

  /**
   * Check if an item exists in cache without fetching from the database.
   * Useful for quick existence checks.
   */
  async existsInCache(cacheKey: string): Promise<boolean> {
    return this.cache.has(cacheKey);
  }

  /**
   * Get cache statistics for monitoring.
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

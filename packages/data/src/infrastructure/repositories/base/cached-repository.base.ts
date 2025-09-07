import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { CacheError } from '../../../domain/errors/data.errors';
import type { IGenericCacheService } from '../../cache/cache.interface';
import { GenericCacheService } from '../../cache/generic-cache.service';

const logger = createFeatureLogger('cached-repo');

/**
 * Base class for repositories with caching capabilities
 * Provides generic cache patterns while allowing dependency injection
 *
 * ⚠️ CRITICAL: Cache patterns are proven to work - preserve core logic
 */
export abstract class CachedRepositoryBase {
  protected readonly defaultTtlMs = 30 * 60 * 1000; // 30 minutes

  constructor(protected readonly cache: IGenericCacheService = GenericCacheService.getInstance()) {}

  /**
   * Generic cached get operation.
   * Tries cache first, falls back to fetcher, then caches the result.
   */
  protected async cachedGet<T>(
    cacheKey: string,
    fetcher: () => Promise<T | null>,
    logContext: Record<string, unknown> = {},
  ): Promise<T | null> {
    try {
      // Try cache first
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        logger.debug('Found in cache', { cacheKey, ...logContext });
        return cached;
      }

      // Not in cache, use fetcher
      logger.debug('Cache miss, using fetcher', { cacheKey, ...logContext });
      const result = await fetcher();

      if (result) {
        // Cache the result
        this.cache.set(cacheKey, result, this.defaultTtlMs);
        logger.debug('Fetched and cached', { cacheKey, ...logContext });
      }

      return result;
    } catch (error) {
      logger.error('Failed cached get operation', error as Error, { cacheKey, ...logContext });
      throw new CacheError('get', (error as Error).message, { cacheKey, ...logContext });
    }
  }

  /**
   * Generic cached save operation.
   * Saves via saver first, then updates cache.
   */
  protected async cachedSave<T>(
    cacheKey: string,
    entity: T,
    saver: (entity: T) => Promise<void>,
    logContext: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      // Save via saver first
      await saver(entity);

      // Then update cache
      this.cache.set(cacheKey, entity, this.defaultTtlMs);

      logger.debug('Saved and cached', { cacheKey, ...logContext });
    } catch (error) {
      logger.error('Failed cached save operation', error as Error, { cacheKey, ...logContext });
      throw new CacheError('save', (error as Error).message, { cacheKey, ...logContext });
    }
  }

  /**
   * Generic cached delete operation.
   * Deletes via deleter first, then removes from cache.
   */
  protected async cachedDelete(
    cacheKey: string,
    deleter: () => Promise<void>,
    logContext: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      // Delete via deleter first
      await deleter();

      // Then remove from cache
      this.cache.delete(cacheKey);

      logger.debug('Deleted from persistence and cache', { cacheKey, ...logContext });
    } catch (error) {
      logger.error('Failed cached delete operation', error as Error, { cacheKey, ...logContext });
      throw new CacheError('delete', (error as Error).message, { cacheKey, ...logContext });
    }
  }

  /**
   * Generic batch cache operation.
   * Useful for caching multiple items at once (like getAll operations).
   */
  protected cacheMultiple<T>(
    items: T[],
    keyExtractor: (item: T) => string,
    logContext: Record<string, unknown> = {},
  ): void {
    try {
      for (const item of items) {
        const cacheKey = keyExtractor(item);
        this.cache.set(cacheKey, item, this.defaultTtlMs);
      }

      logger.debug('Cached multiple items', {
        count: items.length,
        ...logContext,
      });
    } catch (error) {
      logger.error('Failed to cache multiple items', error as Error, { count: items.length, ...logContext });
      throw new CacheError('cache_multiple', (error as Error).message, { count: items.length, ...logContext });
    }
  }

  /**
   * Updates a cache list (like guild channels list).
   */
  protected async updateCacheList(
    listCacheKey: string,
    itemToAddOrRemove: string,
    operation: 'add' | 'remove',
  ): Promise<void> {
    try {
      const currentList = (await this.cache.get<string[]>(listCacheKey)) || [];

      if (operation === 'add') {
        if (!currentList.includes(itemToAddOrRemove)) {
          currentList.push(itemToAddOrRemove);
          this.cache.set(listCacheKey, currentList, this.defaultTtlMs);
        }
      } else if (operation === 'remove') {
        const index = currentList.indexOf(itemToAddOrRemove);
        if (index > -1) {
          currentList.splice(index, 1);
          if (currentList.length === 0) {
            this.cache.delete(listCacheKey);
          } else {
            this.cache.set(listCacheKey, currentList, this.defaultTtlMs);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to update cache list', error as Error, { listCacheKey, itemToAddOrRemove, operation });
      throw new CacheError('update_list', (error as Error).message, { listCacheKey, operation });
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  public cleanupCache(): void {
    this.cache.cleanup();
  }
}

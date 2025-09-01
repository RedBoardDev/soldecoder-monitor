import type { IGenericCacheService } from '../../cache/cache.interface';
import type { DatabaseService } from '../../persistence/dynamo/database.service';

/** Interface for cached repository base functionality */
export interface ICachedRepository {
  /** Generic cache service instance */
  readonly cache: IGenericCacheService;

  /** Database service instance */
  readonly databaseService: DatabaseService;

  /** Default TTL in milliseconds for cache entries */
  readonly defaultTtlMs: number;
}

/** Interface for cached repository operations */
export interface ICachedRepositoryOperations {
  /** Generic cached get operation - tries cache first, falls back to database, then caches the result */
  cachedGet<T>(
    cacheKey: string,
    databaseFetcher: () => Promise<T | null>,
    logContext?: Record<string, unknown>,
  ): Promise<T | null>;

  /** Generic cached save operation - saves to database first, then updates cache */
  cachedSave<T>(
    cacheKey: string,
    entity: T,
    databaseSaver: (entity: T) => Promise<void>,
    logContext?: Record<string, unknown>,
  ): Promise<void>;

  /** Generic cached delete operation - deletes from database first, then removes from cache */
  cachedDelete(
    cacheKey: string,
    databaseDeleter: () => Promise<void>,
    logContext?: Record<string, unknown>,
  ): Promise<void>;

  /** Generic batch cache operation - useful for caching multiple items at once */
  cacheMultiple<T>(items: T[], keyExtractor: (item: T) => string, logContext?: Record<string, unknown>): void;

  /** Updates a cache list (like guild channels list) */
  updateCacheList(listCacheKey: string, itemToAddOrRemove: string, operation: 'add' | 'remove'): Promise<void>;
}

/** Complete interface combining repository properties and operations */
export interface ICachedRepositoryBase extends ICachedRepository, ICachedRepositoryOperations {}

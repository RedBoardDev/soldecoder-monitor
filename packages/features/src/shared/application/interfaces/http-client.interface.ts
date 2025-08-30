import type { z } from 'zod';

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttlMs?: number;
  key?: string;
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Cache information
 */
export interface CacheInfo {
  lastUpdated: string;
  remainingSeconds: number;
  key: string;
}

/**
 * Generic HTTP client interface with caching capabilities
 */
export interface IHttpClient {
  /**
   * Makes an HTTP request with optional caching
   * @param config - Request configuration
   * @param schema - Zod schema for response validation
   * @param cacheConfig - Optional cache configuration
   * @returns Promise resolving to validated response data
   */
  request<T>(config: HttpRequestConfig, schema: z.ZodSchema<T>, cacheConfig?: CacheConfig): Promise<T>;

  /**
   * Makes a GET request with optional caching
   * @param url - Request URL
   * @param schema - Zod schema for response validation
   * @param options - Optional request and cache options
   */
  get<T>(
    url: string,
    schema: z.ZodSchema<T>,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      cache?: CacheConfig;
    },
  ): Promise<T>;

  /**
   * Gets cache information for a specific key
   * @param cacheKey - The cache key
   */
  getCacheInfo(cacheKey: string): CacheInfo | null;

  /**
   * Clears cache for specific key or all cache
   * @param cacheKey - Optional specific key to clear
   */
  clearCache(cacheKey?: string): void;

  /**
   * Checks if HTTP client is healthy
   */
  isHealthy(): Promise<boolean>;
}

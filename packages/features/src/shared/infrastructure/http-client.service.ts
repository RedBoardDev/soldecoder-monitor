import { ExternalServiceError } from '@soldecoder-monitor/discord/src/domain/errors/command.errors';
import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type { z } from 'zod';
import type {
  CacheConfig,
  CacheInfo,
  HttpRequestConfig,
  IHttpClient,
} from '../application/interfaces/http-client.interface';

/**
 * Cached HTTP response data
 */
interface CachedResponse<T = unknown> {
  data: T;
  timestamp: number;
  lastUpdated: string;
  ttlMs: number;
}

/**
 * HTTP client configuration
 */
interface HttpClientConfig {
  baseUrl?: string;
  defaultTimeout: number;
  defaultHeaders: Record<string, string>;
  userAgent: string;
  cacheKeyPrefix?: string;
  defaultCacheTtlMs?: number;
}

/**
 * Generic HTTP client with caching capabilities
 * Encapsulates Axios usage and provides type-safe, cached HTTP requests
 * Each service should create its own instance with specific configuration
 */
export class HttpClientService implements IHttpClient {
  private readonly config: HttpClientConfig;
  private readonly cache = new Map<string, CachedResponse>();

  constructor(config?: Partial<HttpClientConfig>) {
    this.config = {
      defaultTimeout: 30_000,
      defaultHeaders: {
        accept: 'application/json',
      },
      userAgent: 'SolDecoder-Bot/1.0',
      cacheKeyPrefix: 'http-client',
      defaultCacheTtlMs: 60_000, // 1 minute
      ...config,
    };
  }

  /**
   * {@inheritDoc}
   */
  public async request<T>(config: HttpRequestConfig, schema: z.ZodSchema<T>, cacheConfig?: CacheConfig): Promise<T> {
    // Resolve cache configuration with defaults
    const resolvedCacheConfig = cacheConfig?.enabled
      ? {
          ttlMs: cacheConfig.ttlMs ?? this.config.defaultCacheTtlMs ?? 60000,
          key: cacheConfig.key,
        }
      : null;

    // Check cache if enabled
    if (resolvedCacheConfig) {
      const cacheKey = this.generateCacheKey(config, resolvedCacheConfig.key);
      const cachedResponse = this.getCachedResponse<T>(cacheKey, resolvedCacheConfig.ttlMs);
      if (cachedResponse) {
        return cachedResponse.data;
      }
    }

    try {
      // Make HTTP request
      const response = await this.makeRequest(config);

      // Validate response with schema
      const validatedData = this.validateResponse(response.data, schema);

      // Cache response if enabled
      if (resolvedCacheConfig) {
        const cacheKey = this.generateCacheKey(config, resolvedCacheConfig.key);
        this.cacheResponse(cacheKey, validatedData, resolvedCacheConfig.ttlMs);
      }

      return validatedData;
    } catch (error) {
      this.handleRequestError(error, config.url);
      throw error;
    }
  }

  /**
   * {@inheritDoc}
   */
  public async get<T>(
    url: string,
    schema: z.ZodSchema<T>,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      cache?: CacheConfig;
    },
  ): Promise<T> {
    const config: HttpRequestConfig = {
      url,
      method: 'GET',
      headers: options?.headers,
      timeout: options?.timeout,
    };

    return this.request(config, schema, options?.cache);
  }

  /**
   * {@inheritDoc}
   */
  public getCacheInfo(cacheKey: string): CacheInfo | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const remainingMs = cached.ttlMs - (Date.now() - cached.timestamp);
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    return {
      lastUpdated: cached.lastUpdated,
      remainingSeconds,
      key: cacheKey,
    };
  }

  /**
   * {@inheritDoc}
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * {@inheritDoc}
   */
  public async isHealthy(): Promise<boolean> {
    try {
      // Simple ping test
      await axios.get('https://httpbin.org/status/200', {
        timeout: 5000,
        headers: this.getRequestHeaders(),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Makes the actual HTTP request using Axios
   */
  private async makeRequest(config: HttpRequestConfig): Promise<AxiosResponse> {
    const axiosConfig = {
      url: config.url,
      method: config.method || 'GET',
      headers: this.getRequestHeaders(config.headers),
      timeout: config.timeout || this.config.defaultTimeout,
      params: config.params,
    };

    if (this.config.baseUrl && !config.url.startsWith('http')) {
      axiosConfig.url = `${this.config.baseUrl}${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    return axios.request(axiosConfig);
  }

  /**
   * Validates response data using Zod schema
   */
  private validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new ExternalServiceError(
        'HTTP Client',
        `Invalid response format: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
      );
    }
  }

  /**
   * Generates cache key from request configuration
   * Uses custom key if provided, otherwise auto-generates from method+url+params
   */
  private generateCacheKey(config: HttpRequestConfig, customKey?: string): string {
    const servicePrefix = this.config.cacheKeyPrefix ?? 'http-client';

    if (customKey) {
      // Use custom key with service prefix
      return `${servicePrefix}:${customKey}`;
    }

    // Auto-generate key from request details
    const method = config.method || 'GET';
    const url = config.url;
    const paramsKey = config.params ? `:${JSON.stringify(config.params)}` : '';

    return `${servicePrefix}:${method}:${url}${paramsKey}`;
  }

  /**
   * Gets cached response if valid and not expired
   */
  private getCachedResponse<T>(cacheKey: string, ttlMs: number): CachedResponse<T> | null {
    const cached = this.cache.get(cacheKey) as CachedResponse<T> | undefined;
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > ttlMs;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Caches response data with timestamp
   */
  private cacheResponse<T>(cacheKey: string, data: T, ttlMs: number): void {
    const now = Date.now();
    const cachedResponse: CachedResponse<T> = {
      data,
      timestamp: now,
      lastUpdated: new Date(now).toISOString(),
      ttlMs,
    };

    this.cache.set(cacheKey, cachedResponse);
  }

  /**
   * Gets request headers combining defaults with custom headers
   */
  private getRequestHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.config.defaultHeaders,
      'User-Agent': this.config.userAgent,
      ...customHeaders,
    };
  }

  /**
   * Handles HTTP request errors and converts them to domain exceptions
   */
  private handleRequestError(error: unknown, url: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Handle specific HTTP status codes
      switch (axiosError.response?.status) {
        case 404:
          throw new ExternalServiceError('HTTP Client', `Resource not found: ${url}`);
        case 429:
          throw new ExternalServiceError('HTTP Client', 'Rate limit exceeded. Please try again later');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ExternalServiceError('HTTP Client', 'External service temporarily unavailable');
        case 401:
          throw new ExternalServiceError('HTTP Client', 'Authentication required');
        case 403:
          throw new ExternalServiceError('HTTP Client', 'Access forbidden');
        default:
          throw new ExternalServiceError('HTTP Client', `Request failed: ${axiosError.message}`);
      }
    }

    // Handle non-Axios errors
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ExternalServiceError('HTTP Client', `Request error: ${message}`);
  }
}

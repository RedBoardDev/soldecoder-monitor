import type { IRateLimiter } from '@package-utils/domain/interfaces/rate-limiter.interface';
import type { RateLimiterConfig } from '@package-utils/domain/types/rate-limiter.types';
import { RateLimiterService } from '@package-utils/infrastructure/services/rate-limiter.service';
import type { ILogger } from '@soldecoder-monitor/logger/src/types';

/**
 * Factory for creating preconfigured RateLimiter instances
 */
export class RateLimiterFactory {
  constructor(private readonly logger?: ILogger) {}

  /**
   * Create a custom rate limiter with the provided configuration
   */
  public create(config: RateLimiterConfig): IRateLimiter {
    return new RateLimiterService(config, this.logger);
  }

  /**
   * Create a rate limiter for external APIs
   * Restrictive configuration to avoid being rate limited by the API provider
   */
  public createForExternalAPI(name = 'ExternalAPI'): IRateLimiter {
    return new RateLimiterService(
      {
        maxRequests: 10,
        windowMs: 1000,
        maxQueueSize: 100,
        taskTimeout: 30000,
        name,
        fifo: true,
      },
      this.logger,
    );
  }

  /**
   * Create a rate limiter for database requests
   * More permissive configuration but with protection against spikes
   */
  public createForDatabase(name = 'Database'): IRateLimiter {
    return new RateLimiterService(
      {
        maxRequests: 50,
        windowMs: 1000,
        maxQueueSize: 500,
        taskTimeout: 15000,
        name,
        fifo: true,
      },
      this.logger,
    );
  }

  /**
   * Create a rate limiter for write operations
   * Very restrictive configuration to protect resources
   */
  public createForWriteOperations(name = 'WriteOperations'): IRateLimiter {
    return new RateLimiterService(
      {
        maxRequests: 5,
        windowMs: 1000,
        maxQueueSize: 50,
        taskTimeout: 60000,
        name,
        fifo: false, // Allows prioritization
      },
      this.logger,
    );
  }

  /**
   * Create a rate limiter for notifications
   * Configuration to avoid spamming
   */
  public createForNotifications(name = 'Notifications'): IRateLimiter {
    return new RateLimiterService(
      {
        maxRequests: 20,
        windowMs: 60000, // 20 per minute
        maxQueueSize: 200,
        taskTimeout: 10000,
        name,
        fifo: true,
      },
      this.logger,
    );
  }

  /**
   * Create a rate limiter for data import/export operations
   * Configuration for long-running operations
   */
  public createForDataProcessing(name = 'DataProcessing'): IRateLimiter {
    return new RateLimiterService(
      {
        maxRequests: 2,
        windowMs: 1000,
        maxQueueSize: 10,
        taskTimeout: 300000, // 5 minutes
        name,
        fifo: false,
      },
      this.logger,
    );
  }

  /**
   * Create a rate limiter for webhooks
   * Balanced configuration for outgoing calls
   */
  public createForWebhooks(name = 'Webhooks'): IRateLimiter {
    return new RateLimiterService(
      {
        maxRequests: 15,
        windowMs: 1000,
        maxQueueSize: 150,
        taskTimeout: 20000,
        name,
        fifo: true,
      },
      this.logger,
    );
  }
}

/**
 * Rate Limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed within the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum queue size (0 = unlimited) */
  maxQueueSize?: number;
  /** Task timeout in milliseconds (0 = no timeout) */
  taskTimeout?: number;
  /** Name of the rate limiter for logging */
  name?: string;
  /** Enable strict FIFO mode (default: true) */
  fifo?: boolean;
}

/**
 * Options for adding a task to the queue
 */
export interface EnqueueOptions {
  /** Task priority (higher = more priority) */
  priority?: number;
  /** Unique task identifier for cancellation */
  taskId?: string;
  /** Specific timeout for this task */
  timeout?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Rate Limiter statistics
 */
export interface RateLimiterStats {
  /** Number of tasks waiting in the queue */
  queueSize: number;
  /** Number of tasks currently being processed */
  processing: number;
  /** Total number of processed tasks */
  totalProcessed: number;
  /** Total number of failed tasks */
  totalFailed: number;
  /** Total number of timed out tasks */
  totalTimeout: number;
  /** Total number of cancelled tasks */
  totalCancelled: number;
  /** Average execution time in ms */
  avgExecutionTime: number;
  /** Average wait time in ms */
  avgWaitTime: number;
}

/**
 * Task in the queue (internal type)
 */
export interface QueuedTask<T = unknown> {
  id: string;
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  priority: number;
  enqueuedAt: number;
  timeout?: number;
  signal?: AbortSignal;
}

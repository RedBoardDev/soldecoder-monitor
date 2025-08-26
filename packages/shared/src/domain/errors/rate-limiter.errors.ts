/**
 * Base error for the Rate Limiter
 */
export class RateLimiterError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'RateLimiterError';
    this.code = code;
    Object.setPrototypeOf(this, RateLimiterError.prototype);
  }
}

/**
 * Error thrown when the queue is full
 */
export class QueueFullError extends RateLimiterError {
  constructor(maxSize: number) {
    super(`Queue is full (max size: ${maxSize})`, 'QUEUE_FULL');
    Object.setPrototypeOf(this, QueueFullError.prototype);
  }
}

/**
 * Error thrown when a task times out
 */
export class TaskTimeoutError extends RateLimiterError {
  constructor(timeout: number) {
    super(`Task execution timeout after ${timeout}ms`, 'TASK_TIMEOUT');
    Object.setPrototypeOf(this, TaskTimeoutError.prototype);
  }
}

/**
 * Error thrown when a task is cancelled
 */
export class TaskCancelledError extends RateLimiterError {
  constructor() {
    super('Task was cancelled', 'TASK_CANCELLED');
    Object.setPrototypeOf(this, TaskCancelledError.prototype);
  }
}

/**
 * Error thrown when the rate limiter is stopped
 */
export class RateLimiterStoppedError extends RateLimiterError {
  constructor() {
    super('Rate limiter is stopped', 'RATE_LIMITER_STOPPED');
    Object.setPrototypeOf(this, RateLimiterStoppedError.prototype);
  }
}

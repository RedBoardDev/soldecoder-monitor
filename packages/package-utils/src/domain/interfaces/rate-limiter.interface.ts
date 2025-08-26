import type { EnqueueOptions, RateLimiterStats } from '../types/rate-limiter.types';

/**
 * Rate Limiter service interface
 */
export interface IRateLimiter {
  /**
   * Adds a task to the queue
   * @param task - Asynchronous function to execute
   * @param options - Execution options
   * @returns Promise resolved with the result of the task
   * @throws {QueueFullError} If the queue is full
   * @throws {TaskTimeoutError} If the task times out
   * @throws {TaskCancelledError} If the task is cancelled
   * @throws {RateLimiterStoppedError} If the rate limiter is stopped
   */
  enqueue<T>(task: () => Promise<T>, options?: EnqueueOptions): Promise<T>;

  /**
   * Cancels a specific task
   * @param taskId - Identifier of the task to cancel
   * @returns true if the task was cancelled, false otherwise
   */
  cancel(taskId: string): boolean;

  /**
   * Cancels all pending tasks
   * @returns Number of tasks cancelled
   */
  cancelAll(): number;

  /**
   * Clears the queue without executing the tasks
   * @returns Number of tasks removed
   */
  clear(): number;

  /**
   * Stops the rate limiter gracefully
   * Waits for currently running tasks to finish
   * @returns Promise resolved when the rate limiter is stopped
   */
  stop(): Promise<void>;

  /**
   * Starts the rate limiter if it was stopped
   */
  start(): void;

  /**
   * Gets the current statistics
   * @returns Rate limiter statistics
   */
  getStats(): RateLimiterStats;

  /**
   * Checks if the rate limiter is running
   * @returns true if running, false otherwise
   */
  isRunning(): boolean;

  /**
   * Gets the number of pending tasks
   * @returns Number of tasks in the queue
   */
  getQueueSize(): number;

  /**
   * Checks if the queue is full
   * @returns true if the queue is full, false otherwise
   */
  isQueueFull(): boolean;

  /**
   * Waits for all tasks to complete
   * @returns Promise resolved when all tasks are completed
   */
  waitForCompletion(): Promise<void>;
}

import type { ILogger } from '@soldecoder-monitor/logger/src/types';
import type { IRateLimiter } from 'shared/application/interfaces/rate-limiter.interface';
import type {
  EnqueueOptions,
  QueuedTask,
  RateLimiterConfig,
  RateLimiterStats,
} from 'shared/discord/types/rate-limiter.types';
import {
  QueueFullError,
  RateLimiterStoppedError,
  TaskCancelledError,
  TaskTimeoutError,
} from 'shared/domain/errors/rate-limiter.errors';

/**
 * Generic Rate Limiting Service
 * Limits the number of requests executed within a given time window
 */
export class RateLimiterService implements IRateLimiter {
  private readonly config: Required<RateLimiterConfig>;
  private queue: QueuedTask<any>[] = [];
  private processing = 0;
  private running = true;
  private taskCounter = 0;
  private readonly executionTimes: number[] = [];
  private readonly waitTimes: number[] = [];
  private readonly stats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalTimeout: 0,
    totalCancelled: 0,
  };
  private readonly tasksMap = new Map<string, QueuedTask<any>>();
  private lastExecutionTime = 0;
  private readonly logger?: ILogger;

  constructor(config: RateLimiterConfig, logger?: ILogger) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      maxQueueSize: config.maxQueueSize ?? 0,
      taskTimeout: config.taskTimeout ?? 0,
      name: config.name ?? 'RateLimiter',
      fifo: config.fifo ?? true,
    };
    this.logger = logger;
    this.validateConfig();
  }

  /**
   * Validates the rate limiter configuration.
   * Throws an error if any configuration value is invalid.
   */
  private validateConfig(): void {
    if (this.config.maxRequests <= 0) {
      throw new Error('maxRequests must be greater than 0');
    }
    if (this.config.windowMs <= 0) {
      throw new Error('windowMs must be greater than 0');
    }
    if (this.config.maxQueueSize < 0) {
      throw new Error('maxQueueSize must be >= 0');
    }
    if (this.config.taskTimeout < 0) {
      throw new Error('taskTimeout must be >= 0');
    }
  }

  /**
   * @inheritDoc
   */
  public async enqueue<T>(task: () => Promise<T>, options: EnqueueOptions = {}): Promise<T> {
    if (!this.running) {
      throw new RateLimiterStoppedError();
    }

    if (this.isQueueFull()) {
      this.logger?.warn(`[${this.config.name}] Queue is full`, {
        queueSize: this.queue.length,
        maxQueueSize: this.config.maxQueueSize,
      });
      throw new QueueFullError(this.config.maxQueueSize);
    }

    const taskId = options.taskId ?? this.generateTaskId();
    const enqueuedAt = Date.now();

    this.logger?.debug(`[${this.config.name}] Enqueuing task`, {
      taskId,
      priority: options.priority ?? 0,
      queueSize: this.queue.length,
    });

    return new Promise<T>((resolve, reject) => {
      const queuedTask: QueuedTask<T> = {
        id: taskId,
        task,
        resolve,
        reject,
        priority: options.priority ?? 0,
        enqueuedAt,
        timeout: options.timeout ?? this.config.taskTimeout,
        signal: options.signal,
      };

      // Handle cancellation via AbortSignal
      if (queuedTask.signal) {
        const abortHandler = (): void => {
          if (this.removeFromQueue(taskId)) {
            this.stats.totalCancelled++;
            this.logger?.debug(`[${this.config.name}] Task cancelled via signal`, { taskId });
            reject(new TaskCancelledError());
          }
        };
        queuedTask.signal.addEventListener('abort', abortHandler, { once: true });
      }

      this.addToQueue(queuedTask);
      this.processNext().catch((error) => {
        this.logger?.error(`[${this.config.name}] Error processing next task`, error);
      });
    });
  }

  /**
   * Adds a task to the queue, respecting FIFO or priority order.
   * @param task - The queued task to add.
   */
  private addToQueue<T>(task: QueuedTask<T>): void {
    this.tasksMap.set(task.id, task);

    if (this.config.fifo || task.priority === 0) {
      this.queue.push(task);
    } else {
      // Insert according to priority (higher priority first)
      const index = this.queue.findIndex((t) => t.priority < task.priority);
      if (index === -1) {
        this.queue.push(task);
      } else {
        this.queue.splice(index, 0, task);
      }
    }
  }

  /**
   * Removes a task from the queue by its ID.
   * @param taskId - The ID of the task to remove.
   * @returns true if the task was removed, false otherwise.
   */
  private removeFromQueue(taskId: string): boolean {
    const index = this.queue.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.tasksMap.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Processes the next task in the queue if possible, respecting rate limits.
   */
  private async processNext(): Promise<void> {
    if (!this.running || this.processing >= this.config.maxRequests || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    const timeSinceLastExecution = now - this.lastExecutionTime;
    const minInterval = this.config.windowMs / this.config.maxRequests;

    // Enforce minimum interval between executions
    if (timeSinceLastExecution < minInterval && this.lastExecutionTime > 0) {
      setTimeout(() => {
        this.processNext().catch((error) => {
          this.logger?.error(`[${this.config.name}] Error processing next task`, error);
        });
      }, minInterval - timeSinceLastExecution);
      return;
    }

    const queuedTask = this.queue.shift();
    if (!queuedTask) return;

    this.tasksMap.delete(queuedTask.id);
    this.processing++;
    this.lastExecutionTime = now;

    // Calculate wait time
    const waitTime = now - queuedTask.enqueuedAt;
    this.recordWaitTime(waitTime);

    this.logger?.debug(`[${this.config.name}] Executing task`, {
      taskId: queuedTask.id,
      waitTime,
      processing: this.processing,
    });

    try {
      const startTime = Date.now();
      const result = await this.executeTask(queuedTask);
      const executionTime = Date.now() - startTime;

      this.recordExecutionTime(executionTime);
      this.stats.totalProcessed++;

      this.logger?.debug(`[${this.config.name}] Task completed successfully`, {
        taskId: queuedTask.id,
        executionTime,
      });

      queuedTask.resolve(result);
    } catch (error) {
      this.handleTaskError(queuedTask, error);
    } finally {
      this.processing--;
      if (this.queue.length > 0) {
        this.processNext().catch((error) => {
          this.logger?.error(`[${this.config.name}] Error processing next task`, error);
        });
      }
    }
  }

  /**
   * Executes a queued task, handling optional timeout and cancellation.
   * @param queuedTask - The task to execute.
   * @returns Promise resolved with the task result.
   * @throws {TaskCancelledError} If the task was cancelled before execution.
   * @throws {TaskTimeoutError} If the task times out.
   */
  private async executeTask<T>(queuedTask: QueuedTask<T>): Promise<T> {
    // Check if already cancelled
    if (queuedTask.signal?.aborted) {
      throw new TaskCancelledError();
    }

    // Execute without timeout
    if (!queuedTask.timeout) {
      return await queuedTask.task();
    }

    // Execute with timeout
    return Promise.race([
      queuedTask.task(),
      new Promise<T>((_, reject) => {
        const timeoutId = setTimeout(() => reject(new TaskTimeoutError(queuedTask.timeout!)), queuedTask.timeout);

        // Clean up the timeout if the task finishes first
        queuedTask.task().finally(() => clearTimeout(timeoutId));
      }),
    ]);
  }

  /**
   * Handles errors that occur during task execution.
   * Updates statistics and logs the error.
   * @param queuedTask - The task that failed.
   * @param error - The error that occurred.
   */
  private handleTaskError(queuedTask: QueuedTask<any>, error: unknown): void {
    if (error instanceof TaskTimeoutError) {
      this.stats.totalTimeout++;
      this.logger?.warn(`[${this.config.name}] Task timeout`, {
        taskId: queuedTask.id,
        timeout: queuedTask.timeout,
      });
    } else if (error instanceof TaskCancelledError) {
      this.stats.totalCancelled++;
      this.logger?.debug(`[${this.config.name}] Task cancelled`, {
        taskId: queuedTask.id,
      });
    } else {
      this.stats.totalFailed++;
      this.logger?.error(`[${this.config.name}] Task execution failed`, error, {
        taskId: queuedTask.id,
      });
    }
    queuedTask.reject(error);
  }

  /**
   * Records the execution time of a completed task.
   * Keeps only the last 100 execution times.
   * @param time - The execution time in milliseconds.
   */
  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time);
    if (this.executionTimes.length > 100) {
      this.executionTimes.shift();
    }
  }

  /**
   * Records the wait time of a task before execution.
   * Keeps only the last 100 wait times.
   * @param time - The wait time in milliseconds.
   */
  private recordWaitTime(time: number): void {
    this.waitTimes.push(time);
    if (this.waitTimes.length > 100) {
      this.waitTimes.shift();
    }
  }

  /**
   * @inheritDoc
   */
  public cancel(taskId: string): boolean {
    const task = this.tasksMap.get(taskId);
    if (!task) {
      return false;
    }

    const removed = this.removeFromQueue(taskId);
    if (removed) {
      this.stats.totalCancelled++;
      task.reject(new TaskCancelledError());
      this.logger?.debug(`[${this.config.name}] Task manually cancelled`, { taskId });
    }
    return removed;
  }

  /**
   * @inheritDoc
   */
  public cancelAll(): number {
    const count = this.queue.length;
    const tasks = [...this.queue];

    this.queue = [];
    this.tasksMap.clear();
    this.stats.totalCancelled += count;

    tasks.forEach((task) => {
      task.reject(new TaskCancelledError());
    });

    if (count > 0) {
      this.logger?.info(`[${this.config.name}] All tasks cancelled`, { count });
    }

    return count;
  }

  /**
   * @inheritDoc
   */
  public clear(): number {
    const count = this.queue.length;
    this.queue = [];
    this.tasksMap.clear();

    if (count > 0) {
      this.logger?.info(`[${this.config.name}] Queue cleared`, { count });
    }

    return count;
  }

  /**
   * @inheritDoc
   */
  public async stop(): Promise<void> {
    this.running = false;
    this.logger?.info(`[${this.config.name}] Stopping rate limiter`);
    await this.waitForCompletion();
    this.logger?.info(`[${this.config.name}] Rate limiter stopped`);
  }

  /**
   * @inheritDoc
   */
  public start(): void {
    this.running = true;
    this.logger?.info(`[${this.config.name}] Starting rate limiter`);

    if (this.queue.length > 0) {
      this.processNext().catch((error) => {
        this.logger?.error(`[${this.config.name}] Error processing next task`, error);
      });
    }
  }

  /**
   * @inheritDoc
   */
  public getStats(): RateLimiterStats {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      totalProcessed: this.stats.totalProcessed,
      totalFailed: this.stats.totalFailed,
      totalTimeout: this.stats.totalTimeout,
      totalCancelled: this.stats.totalCancelled,
      avgExecutionTime: this.calculateAverage(this.executionTimes),
      avgWaitTime: this.calculateAverage(this.waitTimes),
    };
  }

  /**
   * Calculates the average of an array of numbers.
   * @param times - Array of numbers.
   * @returns The average value, or 0 if the array is empty.
   */
  private calculateAverage(times: number[]): number {
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * @inheritDoc
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * @inheritDoc
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * @inheritDoc
   */
  public isQueueFull(): boolean {
    return this.config.maxQueueSize > 0 && this.queue.length >= this.config.maxQueueSize;
  }

  /**
   * @inheritDoc
   */
  public async waitForCompletion(): Promise<void> {
    while (this.processing > 0 || this.queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Generates a unique task ID.
   * @returns A unique string identifier for a task.
   */
  private generateTaskId(): string {
    return `${this.config.name}-${Date.now()}-${++this.taskCounter}`;
  }
}

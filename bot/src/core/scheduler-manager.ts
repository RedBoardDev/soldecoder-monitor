import type { ISchedulerManager, ISchedulerMetadata } from '@soldecoder-monitor/features-sdk';
import { logger } from '../utils/logger';

/**
 * Active scheduler instance
 */
interface SchedulerInstance {
  metadata: ISchedulerMetadata;
  handler: () => Promise<void>;
  timer?: NodeJS.Timeout;
  cronJob?: NodeJS.Timeout; // Simple timeout for basic cron simulation
  isRunning: boolean;
}

/**
 * Simple but powerful scheduler manager
 */
export class SchedulerManager implements ISchedulerManager {
  private schedulers: Map<string, SchedulerInstance> = new Map();
  private isReady: boolean = false;

  /**
   * Schedule a new task
   */
  schedule(name: string, metadata: ISchedulerMetadata, handler: () => Promise<void>): void {
    // Stop existing scheduler with same name
    if (this.schedulers.has(name)) {
      this.unschedule(name);
    }

    const instance: SchedulerInstance = {
      metadata,
      handler,
      isRunning: false,
    };

    // Validate configuration
    if (!metadata.cron && !metadata.interval) {
      throw new Error(`Scheduler ${name} must have either 'cron' or 'interval' defined`);
    }

    if (metadata.cron && metadata.interval) {
      logger.warn(`Scheduler ${name} has both 'cron' and 'interval', using 'cron'`);
    }

    this.schedulers.set(name, instance);

    // Start the scheduler if enabled AND bot is ready
    if (metadata.enabled !== false && this.isReady) {
      this.startScheduler(name, instance);
    }

    logger.info(
      `Scheduled task: ${name} (${metadata.cron || `${metadata.interval}ms interval`}) - ${this.isReady ? 'started' : 'waiting for bot ready'}`,
    );
  }

  /**
   * Remove a scheduled task
   */
  unschedule(name: string): void {
    const instance = this.schedulers.get(name);
    if (!instance) return;

    this.stopScheduler(instance);
    this.schedulers.delete(name);
    logger.info(`Unscheduled task: ${name}`);
  }

  /**
   * Check if a task is scheduled
   */
  isScheduled(name: string): boolean {
    return this.schedulers.has(name);
  }

  /**
   * Get all scheduled tasks
   */
  getSchedules(): Map<string, { metadata: ISchedulerMetadata; isRunning: boolean }> {
    const result = new Map();
    for (const [name, instance] of this.schedulers) {
      result.set(name, {
        metadata: instance.metadata,
        isRunning: instance.isRunning,
      });
    }
    return result;
  }

  /**
   * Mark scheduler manager as ready and start all pending schedulers
   */
  setReady(): void {
    if (this.isReady) return;

    this.isReady = true;
    logger.info('🚀 SchedulerManager is now ready - starting all pending schedulers');

    // Start all schedulers that were waiting
    for (const [name, instance] of this.schedulers) {
      if (instance.metadata.enabled !== false && !instance.timer && !instance.cronJob) {
        logger.info(`Starting pending scheduler: ${name}`);
        this.startScheduler(name, instance);
      }
    }

    logger.info(`✅ Started ${this.schedulers.size} schedulers`);
  }

  /**
   * Check if scheduler manager is ready
   */
  isSchedulerReady(): boolean {
    return this.isReady;
  }

  /**
   * Stop all schedulers (called on shutdown)
   */
  stopAll(): void {
    for (const [name] of this.schedulers) {
      this.unschedule(name);
    }
    this.isReady = false;
    logger.info('All schedulers stopped');
  }

  /**
   * Start a scheduler instance
   */
  private startScheduler(name: string, instance: SchedulerInstance): void {
    const { metadata, handler } = instance;

    // Run immediately if requested
    if (metadata.immediate) {
      this.executeTask(name, handler);
    }

    // Setup recurring execution
    if (metadata.cron) {
      // For now, we'll use a simple cron parser
      // TODO: Add proper cron support with node-cron library
      logger.warn(`Cron scheduling not yet implemented for ${name}, falling back to interval`);

      // Parse simple cron to interval (basic implementation)
      const interval = this.cronToInterval(metadata.cron);
      if (interval) {
        this.scheduleInterval(name, instance, interval);
      }
    } else if (metadata.interval) {
      this.scheduleInterval(name, instance, metadata.interval);
    }
  }

  /**
   * Schedule with interval
   */
  private scheduleInterval(name: string, instance: SchedulerInstance, interval: number): void {
    instance.timer = setInterval(async () => {
      await this.executeTask(name, instance.handler);
    }, interval);
  }

  /**
   * Stop a scheduler instance
   */
  private stopScheduler(instance: SchedulerInstance): void {
    if (instance.timer) {
      clearInterval(instance.timer);
      instance.timer = undefined;
    }

    if (instance.cronJob) {
      // Stop cron job when implemented
      instance.cronJob = undefined;
    }

    instance.isRunning = false;
  }

  /**
   * Execute a scheduled task with error handling
   */
  private async executeTask(name: string, handler: () => Promise<void>): Promise<void> {
    const instance = this.schedulers.get(name);
    if (!instance) return;

    if (instance.isRunning) {
      logger.warn(`Scheduler ${name} is already running, skipping execution`);
      return;
    }

    instance.isRunning = true;

    try {
      await handler();
    } catch (error) {
      logger.error(`Error in scheduled task ${name}:`, error);
    } finally {
      instance.isRunning = false;
    }
  }

  /**
   * Basic cron to interval converter (simplified)
   * TODO: Replace with proper cron library
   */
  private cronToInterval(cron: string): number | null {
    // Very basic cron patterns
    const patterns: Record<string, number> = {
      '*/1 * * * *': 60000, // Every minute
      '*/5 * * * *': 300000, // Every 5 minutes
      '*/10 * * * *': 600000, // Every 10 minutes
      '*/15 * * * *': 900000, // Every 15 minutes
      '*/30 * * * *': 1800000, // Every 30 minutes
      '0 * * * *': 3600000, // Every hour
      '0 */6 * * *': 21600000, // Every 6 hours
      '0 0 * * *': 86400000, // Daily at midnight
    };

    return patterns[cron] || null;
  }
}

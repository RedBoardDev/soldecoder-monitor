import * as cron from 'node-cron';
import type { Logger, SchedulerRegistration } from '../types';

interface ActiveScheduler {
  registration: SchedulerRegistration;
  cronJob?: cron.ScheduledTask;
  intervalId?: NodeJS.Timeout;
}

/**
 * Scheduler service
 * Manages cron jobs and interval tasks
 */
export class SchedulerService {
  private readonly schedulers = new Map<string, ActiveScheduler>();

  constructor(private readonly logger: Logger) {}

  /**
   * Register a scheduler
   */
  registerScheduler(registration: SchedulerRegistration): void {
    const key = this.getSchedulerKey(registration);

    // Stop existing if any
    this.unregisterScheduler(key);

    const activeScheduler: ActiveScheduler = { registration };

    if (registration.pattern) {
      // Cron job
      activeScheduler.cronJob = this.createCronJob(registration, key);
    } else if (registration.interval) {
      // Interval job
      activeScheduler.intervalId = this.createInterval(registration, key);
    } else {
      this.logger.warn(`Scheduler ${key} has neither pattern nor interval`);
      return;
    }

    this.schedulers.set(key, activeScheduler);

    // Run on init if configured
    if (registration.runOnInit) {
      this.executeHandler(registration, key);
    }
  }

  /**
   * Unregister a scheduler
   */
  unregisterScheduler(key: string): void {
    const activeScheduler = this.schedulers.get(key);

    if (!activeScheduler) {
      return;
    }

    // Stop cron job
    if (activeScheduler.cronJob) {
      activeScheduler.cronJob.stop();
    }

    // Clear interval
    if (activeScheduler.intervalId) {
      clearInterval(activeScheduler.intervalId);
    }

    this.schedulers.delete(key);
  }

  /**
   * Stop all schedulers
   */
  stopAll(): void {
    for (const activeScheduler of this.schedulers.values()) {
      if (activeScheduler.cronJob) {
        activeScheduler.cronJob.stop();
      }
      if (activeScheduler.intervalId) {
        clearInterval(activeScheduler.intervalId);
      }
    }

    this.schedulers.clear();
    this.logger.info('All schedulers stopped');
  }

  /**
   * Get all active schedulers
   */
  getSchedulers(): ReadonlyMap<string, ActiveScheduler> {
    return this.schedulers;
  }

  /**
   * Create a cron job
   */
  private createCronJob(registration: SchedulerRegistration, key: string): cron.ScheduledTask {
    if (!registration.pattern) {
      throw new Error(`Cron pattern not provided for scheduler ${key}`);
    }

    return cron.schedule(registration.pattern, () => this.executeHandler(registration, key), {
      scheduled: true,
      timezone: registration.feature === 'system' ? undefined : 'UTC', // Use UTC for consistency
    });
  }

  /**
   * Create an interval
   */
  private createInterval(registration: SchedulerRegistration, key: string): NodeJS.Timeout {
    if (!registration.interval) {
      throw new Error(`Interval not provided for scheduler ${key}`);
    }

    return setInterval(() => this.executeHandler(registration, key), registration.interval);
  }

  /**
   * Execute scheduler handler
   */
  private executeHandler(registration: SchedulerRegistration, key: string): void {
    registration.handler().catch((error: unknown) => {
      this.logger.error(`Error in scheduler ${key}:`, error);
    });
  }

  /**
   * Get scheduler key
   */
  private getSchedulerKey(registration: SchedulerRegistration): string {
    return `${registration.feature}.${registration.method}`;
  }
}

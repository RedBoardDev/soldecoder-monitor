import type { Client } from 'discord.js';

/**
 * Feature metadata interface
 */
export interface IFeatureMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

/**
 * Feature lifecycle hooks
 */
export interface IFeatureLifecycle {
  /**
   * Called when feature is loaded
   */
  onLoad?(context: IFeatureContext): Promise<void> | void;

  /**
   * Called when feature is enabled
   */
  onEnable?(context: IFeatureContext): Promise<void> | void;

  /**
   * Called when feature is disabled
   */
  onDisable?(): Promise<void> | void;

  /**
   * Called when feature is unloaded
   */
  onUnload?(): Promise<void> | void;
}

/**
 * Feature context provided to features
 */
export interface IFeatureContext {
  client: Client;
  logger: ILogger;
  config: IFeatureConfig;
}

/**
 * Feature configuration interface
 */
export interface IFeatureConfig {
  enabled: boolean;
  [key: string]: unknown;
}

/**
 * Logger interface for features
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error | unknown): void;
}

/**
 * Base feature interface
 */
export interface IFeature extends IFeatureLifecycle {
  metadata: IFeatureMetadata;
}

/**
 * Scheduler metadata
 */
export interface ISchedulerMetadata {
  name: string;
  cron?: string; // Cron expression (e.g., "0 */5 * * * *" every 5 minutes)
  interval?: number; // Interval in milliseconds
  immediate?: boolean; // Run immediately on start
  enabled?: boolean; // Can be disabled
}

/**
 * Scheduler manager interface
 */
export interface ISchedulerManager {
  schedule(name: string, metadata: ISchedulerMetadata, handler: () => Promise<void>): void;
  unschedule(name: string): void;
  isScheduled(name: string): boolean;
  getSchedules(): Map<string, { metadata: ISchedulerMetadata; isRunning: boolean }>;
}
